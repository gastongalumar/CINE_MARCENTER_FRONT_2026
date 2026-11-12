import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  afterNextRender,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PeliculaService } from '../../services/pelicula';
import { ImageService } from '../../services/image';
import { AuthService } from '../../services/auth';
import { Pelicula } from '../../models/pelicula';
import { etiquetaGenero } from '../../models/genero-pelicula';
import { getErrorMessage } from '../../utils/api-error';
import { refreshView } from '../../utils/refresh-view';
import { fechaLocalIso, parseApiDateTime } from '../../utils/datetime';
import { autorizarButacas } from '../../utils/butacas-access';

@Component({
  selector: 'app-pelicula-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pelicula-detalle.html',
  styleUrls: ['./pelicula-detalle.css'],
})
export class PeliculaDetalleComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly peliculaService = inject(PeliculaService);
  private readonly authService = inject(AuthService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly imageService = inject(ImageService);
  readonly etiquetaGenero = etiquetaGenero;
  readonly esAdmin = this.authService.isAdmin;

  pelicula: Pelicula | null = null;
  cargando = true;
  errorCarga = '';
  imageError = false;
  trailerYoutubeId: string | null = null;
  trailerUrl: SafeResourceUrl | null = null;
  trailerReproduciendo = false;

  private readonly initLoad = afterNextRender(() => {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.cargando = false;
      this.errorCarga = 'Película no válida.';
      refreshView(this.cdr);
      return;
    }
    this.cargar(id);
  });

  get trailerThumbnailUrl(): string | null {
    return this.trailerYoutubeId
      ? `https://i.ytimg.com/vi/${this.trailerYoutubeId}/hqdefault.jpg`
      : null;
  }

  get esProximamente(): boolean {
    if (!this.pelicula?.fechaEstreno) return false;
    const estreno = parseApiDateTime(`${this.pelicula.fechaEstreno}T00:00:00`);
    if (!estreno) return false;
    return fechaLocalIso(estreno) > fechaLocalIso();
  }

  get estaEnCartelera(): boolean {
    if (!this.pelicula?.fechaEstreno || !this.pelicula?.fechaSalida) return false;
    const hoy = fechaLocalIso();
    return this.pelicula.fechaEstreno <= hoy && this.pelicula.fechaSalida >= hoy;
  }

  private cargar(id: number): void {
    this.cargando = true;
    this.errorCarga = '';
    this.peliculaService.obtenerPorId(id, { skipErrorToast: true }).subscribe({
      next: (pelicula) => {
        this.pelicula = pelicula;
        this.trailerYoutubeId = this.extraerYoutubeId(pelicula.urlTrailer);
        this.trailerUrl = null;
        this.trailerReproduciendo = false;
        this.cargando = false;
        refreshView(this.cdr);
      },
      error: (error: unknown) => {
        this.pelicula = null;
        this.trailerYoutubeId = null;
        this.trailerUrl = null;
        this.trailerReproduciendo = false;
        this.cargando = false;
        this.errorCarga = getErrorMessage(error, 'No se pudo cargar la película.');
        refreshView(this.cdr);
      },
    });
  }

  iniciarTrailer(): void {
    if (!this.trailerYoutubeId || this.trailerReproduciendo) return;
    this.trailerUrl = this.armarTrailerEmbed(this.trailerYoutubeId, true);
    this.trailerReproduciendo = true;
    refreshView(this.cdr);
  }

  detenerTrailer(): void {
    if (!this.trailerReproduciendo) return;
    this.trailerReproduciendo = false;
    this.trailerUrl = null;
    refreshView(this.cdr);
  }

  alternarTrailer(): void {
    if (this.trailerReproduciendo) {
      this.detenerTrailer();
    } else {
      this.iniciarTrailer();
    }
  }

  volver(): void {
    this.router.navigate(['/cartelera']);
  }

  irAFunciones(): void {
    if (!this.pelicula?.id) return;
    autorizarButacas(this.pelicula.id);
    this.router.navigate(['/butacas', this.pelicula.id]);
  }

  onImageError(): void {
    this.imageError = true;
    refreshView(this.cdr);
  }

  private armarTrailerEmbed(id: string, autoplay: boolean): SafeResourceUrl {
    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      mute: '1',
      controls: '1',
      rel: '0',
      modestbranding: '1',
      playsinline: '1',
    });
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${id}?${params.toString()}`
    );
  }

  private extraerYoutubeId(url?: string): string | null {
    if (!url?.trim()) return null;
    const valor = url.trim();

    const patrones = [
      /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{11})/,
      /^([A-Za-z0-9_-]{11})$/,
    ];

    for (const patron of patrones) {
      const match = valor.match(patron);
      if (match?.[1]) return match[1];
    }
    return null;
  }
}

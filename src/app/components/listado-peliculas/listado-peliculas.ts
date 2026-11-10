import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { PeliculaService } from '../../services/pelicula';
import { ImageService } from '../../services/image';
import { ConfirmDialogService } from '../../services/confirm-dialog';
import { Pelicula } from '../../models/pelicula';
import { etiquetaGenero } from '../../models/genero-pelicula';
import { getErrorMessage } from '../../utils/api-error';

@Component({
  selector: 'app-listado-peliculas',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './listado-peliculas.html',
  styleUrls: ['../../styles/admin-panel.shared.css', './listado-peliculas.css'],
})
export class ListadoPeliculasComponent {
  private readonly peliculaService = inject(PeliculaService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);

  readonly imageService = inject(ImageService);
  readonly etiquetaGenero = etiquetaGenero;

  readonly peliculas = signal<Pelicula[]>([]);
  readonly cargando = signal(true);
  readonly errorCarga = signal('');
  readonly filtro = signal('');
  readonly filtroDuracion = signal<number | null>(null);
  readonly filtroGenero = signal('');
  readonly pagina = signal(1);
  readonly pageSize = 6;

  readonly nombresOpciones = computed(() =>
    [...new Set(this.peliculas().map((p) => p.nombre).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, 'es')
    )
  );

  readonly duracionesOpciones = computed(() =>
    [...new Set(this.peliculas().map((p) => p.duracionMinutos).filter((d) => d > 0))].sort(
      (a, b) => a - b
    )
  );

  readonly generosOpciones = computed(() => {
    const generos = [...new Set(this.peliculas().map((p) => p.genero).filter(Boolean))];
    return generos.sort((a, b) => etiquetaGenero(a).localeCompare(etiquetaGenero(b), 'es'));
  });

  readonly hayFiltrosActivos = computed(
    () =>
      !!this.filtro().trim() || this.filtroDuracion() !== null || !!this.filtroGenero()
  );

  readonly peliculasFiltradas = computed(() => {
    const termino = this.filtro().trim().toLowerCase();
    const duracion = this.filtroDuracion();
    const genero = this.filtroGenero();

    return this.peliculas().filter((p) => {
      if (termino) {
        const coincideTexto =
          p.nombre.toLowerCase().includes(termino) ||
          etiquetaGenero(p.genero).toLowerCase().includes(termino);
        if (!coincideTexto) return false;
      }
      if (duracion !== null && p.duracionMinutos !== duracion) return false;
      if (genero && p.genero !== genero) return false;
      return true;
    });
  });

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.peliculasFiltradas().length / this.pageSize))
  );

  readonly peliculasPagina = computed(() => {
    const start = (this.pagina() - 1) * this.pageSize;
    return this.peliculasFiltradas().slice(start, start + this.pageSize);
  });

  readonly rangoDesde = computed(() => {
    if (!this.peliculasFiltradas().length) return 0;
    return (this.pagina() - 1) * this.pageSize + 1;
  });

  readonly rangoHasta = computed(() =>
    Math.min(this.pagina() * this.pageSize, this.peliculasFiltradas().length)
  );

  private readonly initLoad = afterNextRender(() => this.cargarPeliculas());

  cargarPeliculas(): void {
    this.cargando.set(true);
    this.peliculaService.listarTodas({ skipErrorToast: true }).subscribe({
      next: (peliculas) => {
        this.peliculas.set(peliculas);
        this.ajustarPagina();
        this.cargando.set(false);
      },
      error: (error) => {
        this.errorCarga.set(getErrorMessage(error, 'No se pudieron cargar las películas.'));
        this.cargando.set(false);
      },
    });
  }

  actualizarFiltro(valor: string): void {
    this.filtro.set(valor);
    this.pagina.set(1);
  }

  actualizarFiltroDuracion(valor: string): void {
    this.filtroDuracion.set(valor === '' ? null : Number(valor));
    this.pagina.set(1);
  }

  actualizarFiltroGenero(valor: string): void {
    this.filtroGenero.set(valor);
    this.pagina.set(1);
  }

  limpiarFiltros(): void {
    this.filtro.set('');
    this.filtroDuracion.set(null);
    this.filtroGenero.set('');
    this.pagina.set(1);
  }

  irAPagina(page: number): void {
    const total = this.totalPaginas();
    if (page < 1 || page > total) return;
    this.pagina.set(page);
  }

  editar(pelicula: Pelicula): void {
    if (!pelicula.id) return;
    void this.router.navigate(['/admin/peliculas'], { queryParams: { id: pelicula.id } });
  }

  eliminar(pelicula: Pelicula): void {
    if (!pelicula.id) return;

    this.confirmDialog
      .confirmDanger(
        'Eliminar película',
        `¿Seguro que querés eliminar «${pelicula.nombre}»? Esta acción no se puede deshacer.`
      )
      .subscribe((confirmado) => {
        if (!confirmado) return;

        this.peliculaService.eliminar(pelicula.id!).subscribe({
          next: () => {
            this.toastr.success('Película eliminada', 'Éxito');
            this.cargarPeliculas();
          },
        });
      });
  }

  private ajustarPagina(): void {
    const total = this.totalPaginas();
    if (this.pagina() > total) {
      this.pagina.set(total);
    }
  }
}

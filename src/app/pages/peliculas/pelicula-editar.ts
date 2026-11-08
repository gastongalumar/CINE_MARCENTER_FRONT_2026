import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpEventType } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

import { PeliculaService } from '../../services/pelicula';
import { ImageService } from '../../services/image';
import { Pelicula, PeliculaRequest } from '../../models/pelicula';
import { GENEROS_PELICULA, GeneroPelicula, etiquetaGenero } from '../../models/genero-pelicula';
import { getErrorMessage } from '../../utils/api-error';
import { aplicarErroresDeCampos, limpiarErroresDeCampos } from '../../utils/form-error';
import { diasInclusive, formatearFechaCorta } from '../../utils/datetime';
import { CineDatePickerComponent } from '../../components/cine-date-picker/cine-date-picker';

function rangoDeFechas(group: AbstractControl): ValidationErrors | null {
  const estreno = group.get('fechaEstreno')?.value as string | null;
  const salida = group.get('fechaSalida')?.value as string | null;
  if (!estreno || !salida) return null;
  return salida > estreno ? null : { rangoFechas: true };
}

@Component({
  selector: 'app-pelicula-editar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, CineDatePickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pelicula-editar.html',
  styleUrls: ['./peliculas.css', './pelicula-editar.css'],
})
export class PeliculaEditarComponent {
  private readonly peliculaService = inject(PeliculaService);
  private readonly toastr = inject(ToastrService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly imageService = inject(ImageService);
  readonly generos = GENEROS_PELICULA;
  readonly etiquetaGenero = etiquetaGenero;

  readonly pelicula = signal<Pelicula | null>(null);
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly errorCarga = signal('');
  readonly errorMensaje = signal('');
  readonly archivoSeleccionado = signal<File | null>(null);
  readonly subiendo = signal(false);
  readonly progreso = signal(0);
  readonly errorImagen = signal('');
  readonly errorPreview = signal(false);
  readonly resumenCartelera = signal<{ desde: string; hasta: string; dias: number } | null>(null);

  readonly sinopsisPorDefecto =
    'Sinopsis pendiente. Próximamente se publicará la descripción oficial de la película.';

  readonly form = this.fb.group(
    {
      nombre: ['', [Validators.required, Validators.maxLength(200)]],
      genero: ['', [Validators.required]],
      fechaEstreno: ['', [Validators.required]],
      fechaSalida: ['', [Validators.required]],
      duracionMinutos: [120, [Validators.required, Validators.min(1), Validators.max(600)]],
      sinopsis: [this.sinopsisPorDefecto, [Validators.maxLength(2000)]],
      descripcion: ['', [Validators.maxLength(5000)]],
      director: ['', [Validators.maxLength(200)]],
      elenco: ['', [Validators.maxLength(500)]],
      clasificacion: ['', [Validators.maxLength(100)]],
      nominaciones: ['', [Validators.maxLength(1000)]],
      urlTrailer: ['', [Validators.maxLength(500)]],
      rutaImagen: [''],
    },
    { validators: [rangoDeFechas] }
  );

  private readonly initLoad = afterNextRender(() => this.cargar());

  constructor() {
    this.form.controls.rutaImagen.valueChanges.subscribe(() => this.errorPreview.set(false));
    this.form.valueChanges.subscribe(() => this.actualizarResumenCartelera());
  }

  cargar(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || Number.isNaN(id)) {
      this.errorCarga.set('Película inválida.');
      this.cargando.set(false);
      return;
    }

    this.cargando.set(true);
    this.peliculaService.obtenerPorId(id).subscribe({
      next: (pelicula) => {
        this.pelicula.set(pelicula);
        this.form.patchValue({
          nombre: pelicula.nombre,
          genero: pelicula.genero,
          fechaEstreno: pelicula.fechaEstreno,
          fechaSalida: pelicula.fechaSalida,
          duracionMinutos: pelicula.duracionMinutos,
          sinopsis: pelicula.sinopsis?.trim() || this.sinopsisPorDefecto,
          descripcion: pelicula.descripcion ?? '',
          director: pelicula.director ?? '',
          elenco: pelicula.elenco ?? '',
          clasificacion: pelicula.clasificacion ?? '',
          nominaciones: pelicula.nominaciones ?? '',
          urlTrailer: pelicula.urlTrailer ?? '',
          rutaImagen: pelicula.rutaImagen ?? '',
        });
        this.actualizarResumenCartelera();
        this.cargando.set(false);
      },
      error: (error) => {
        this.errorCarga.set(getErrorMessage(error, 'No se pudo cargar la película.'));
        this.cargando.set(false);
      },
    });
  }

  guardar(): void {
    this.limpiarErrores();
    const actual = this.pelicula();
    if (!actual?.id) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.peliculaService.actualizar(actual.id, this.construirPayload()).subscribe({
      next: (guardada) => {
        this.guardando.set(false);
        this.toastr.success('Película actualizada', 'Éxito');

        const imagenGuardada = {
          ...guardada,
          rutaImagen: guardada.rutaImagen ?? actual.rutaImagen,
        };
        this.pelicula.set(imagenGuardada);

        const url = (this.form.controls.rutaImagen.value ?? '').trim();
        this.errorPreview.set(false);

        if (this.esUrlHttp(url)) {
          this.importarImagenDesdeUrl(actual.id!, url);
        } else {
          this.form.patchValue({ rutaImagen: imagenGuardada.rutaImagen ?? '' });
        }
      },
      error: (error) => {
        this.guardando.set(false);
        const mapeados = aplicarErroresDeCampos(this.form, error);
        this.errorMensaje.set(
          mapeados
            ? 'Revisá los campos marcados.'
            : getErrorMessage(error, 'No se pudo guardar la película.')
        );
      },
    });
  }

  volver(): void {
    this.router.navigate(['/admin/peliculas']);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.archivoSeleccionado.set(input.files?.[0] ?? null);
    this.errorImagen.set('');
  }

  subirImagen(): void {
    const archivo = this.archivoSeleccionado();
    const pelicula = this.pelicula();
    if (!archivo || !pelicula?.id) return;
    this.subirArchivo(pelicula.id, archivo);
  }

  onPreviewError(): void {
    this.errorPreview.set(true);
  }

  esInvalido(campo: string): boolean {
    const control = this.form.get(campo);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  private actualizarResumenCartelera(): void {
    const desde = this.form.controls.fechaEstreno.value;
    const hasta = this.form.controls.fechaSalida.value;
    const dias = diasInclusive(desde ?? '', hasta ?? '');
    if (!desde || !hasta || dias == null) {
      this.resumenCartelera.set(null);
      return;
    }
    this.resumenCartelera.set({
      desde: formatearFechaCorta(desde),
      hasta: formatearFechaCorta(hasta),
      dias,
    });
  }

  private subirArchivo(id: number, archivo: File): void {
    this.subiendo.set(true);
    this.progreso.set(0);
    this.errorImagen.set('');

    this.peliculaService.subirImagen(id, archivo).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          const total = event.total ?? event.loaded;
          this.progreso.set(total ? Math.round((100 * event.loaded) / total) : 0);
        } else if (event.type === HttpEventType.Response) {
          this.subiendo.set(false);
          this.progreso.set(0);
          this.archivoSeleccionado.set(null);
          this.toastr.success('Póster guardado correctamente', 'Éxito');
          this.peliculaService.obtenerPorId(id).subscribe({
            next: (pelicula) => {
              this.pelicula.set(pelicula);
              this.form.patchValue({ rutaImagen: pelicula.rutaImagen ?? '' });
            },
          });
        }
      },
      error: (error) => {
        this.subiendo.set(false);
        this.progreso.set(0);
        this.errorImagen.set(getErrorMessage(error, 'No se pudo subir la imagen.'));
      },
    });
  }

  private importarImagenDesdeUrl(id: number, url: string): void {
    this.subiendo.set(true);
    this.progreso.set(0);
    this.errorImagen.set('');
    this.toastr.info('Descargando la imagen de la URL…', 'Póster');

    fetch(url, { mode: 'cors' })
      .then(async (respuesta) => {
        if (!respuesta.ok) {
          throw new Error(`la URL respondió con estado ${respuesta.status}`);
        }
        const blob = await respuesta.blob();
        const tipo = (blob.type || respuesta.headers.get('content-type') || '')
          .split(';')[0]
          .trim()
          .toLowerCase();
        const extension = this.extensionDeImagen(tipo);
        if (!extension) {
          throw new Error('la URL no apunta a una imagen JPEG, PNG o WEBP');
        }
        if (blob.size > 5 * 1024 * 1024) {
          throw new Error('la imagen supera el máximo permitido de 5 MB');
        }
        return new File([blob], `poster.${extension}`, { type: tipo });
      })
      .then((archivo) => this.subirArchivo(id, archivo))
      .catch((error: unknown) => {
        this.subiendo.set(false);
        this.progreso.set(0);
        const detalle = error instanceof Error ? error.message : 'no se pudo descargar';
        this.errorImagen.set(`No se pudo usar la URL: ${detalle}. Subí el archivo manualmente.`);
        this.toastr.warning(
          'La película se guardó, pero la imagen no. Probá subirla como archivo.',
          'Póster'
        );
      });
  }

  private esUrlHttp(valor: string): boolean {
    return /^https?:\/\//i.test(valor);
  }

  private extensionDeImagen(tipo: string): string | null {
    switch (tipo) {
      case 'image/jpeg':
      case 'image/jpg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      default:
        return null;
    }
  }

  private construirPayload(): PeliculaRequest {
    const valores = this.form.getRawValue();
    const sinopsis = (valores.sinopsis ?? '').trim();
    return {
      nombre: (valores.nombre ?? '').trim(),
      genero: valores.genero as GeneroPelicula,
      fechaEstreno: valores.fechaEstreno ?? '',
      fechaSalida: valores.fechaSalida ?? '',
      duracionMinutos: Number(valores.duracionMinutos),
      sinopsis: sinopsis || this.sinopsisPorDefecto,
      descripcion: (valores.descripcion ?? '').trim(),
      director: (valores.director ?? '').trim(),
      elenco: (valores.elenco ?? '').trim(),
      clasificacion: (valores.clasificacion ?? '').trim(),
      nominaciones: (valores.nominaciones ?? '').trim(),
      urlTrailer: (valores.urlTrailer ?? '').trim(),
    };
  }

  private limpiarErrores(): void {
    limpiarErroresDeCampos(this.form);
    this.errorMensaje.set('');
  }
}

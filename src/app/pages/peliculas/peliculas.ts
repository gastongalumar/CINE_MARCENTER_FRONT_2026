import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
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
import { Router, RouterModule } from '@angular/router';
import { HttpEventType } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

import { PeliculaService } from '../../services/pelicula';
import { ImageService } from '../../services/image';
import { ConfirmDialogService } from '../../services/confirm-dialog';
import { Pelicula, PeliculaRequest } from '../../models/pelicula';
import { GENEROS_PELICULA, GeneroPelicula, etiquetaGenero } from '../../models/genero-pelicula';
import { getErrorMessage } from '../../utils/api-error';
import { aplicarErroresDeCampos, limpiarErroresDeCampos } from '../../utils/form-error';
import { diasInclusive, fechaLocalIso, formatearFechaCorta } from '../../utils/datetime';
import { CineDatePickerComponent } from '../../components/cine-date-picker/cine-date-picker';

/** Valida que una fecha `yyyy-MM-dd` sea posterior a hoy (regla @Future del backend). */
function fechaFutura(control: AbstractControl): ValidationErrors | null {
  const valor = control.value as string | null;
  if (!valor) return null;
  return valor > fechaLocalIso() ? null : { fechaFutura: true };
}

/** La fecha de salida debe ser posterior a la de estreno (FechasPeliculaValidator). */
function rangoDeFechas(group: AbstractControl): ValidationErrors | null {
  const estreno = group.get('fechaEstreno')?.value as string | null;
  const salida = group.get('fechaSalida')?.value as string | null;
  if (!estreno || !salida) return null;
  return salida > estreno ? null : { rangoFechas: true };
}

@Component({
  selector: 'app-peliculas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, CineDatePickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './peliculas.html',
  styleUrls: ['./peliculas.css'],
})
export class PeliculasComponent {
  private readonly peliculaService = inject(PeliculaService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toastr = inject(ToastrService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly imageService = inject(ImageService);

  readonly generos = GENEROS_PELICULA;
  readonly etiquetaGenero = etiquetaGenero;

  readonly peliculas = signal<Pelicula[]>([]);
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly errorCarga = signal('');
  readonly errorMensaje = signal('');
  readonly filtro = signal('');
  readonly errorPreview = signal(false);

  readonly peliculasFiltradas = computed(() => {
    const termino = this.filtro().trim().toLowerCase();
    if (!termino) return this.peliculas();
    return this.peliculas().filter(
      (p) =>
        p.nombre.toLowerCase().includes(termino) ||
        etiquetaGenero(p.genero).toLowerCase().includes(termino)
    );
  });

  readonly sinopsisPorDefecto =
    'Sinopsis pendiente. Próximamente se publicará la descripción oficial de la película.';

  readonly form = this.fb.group(
    {
      nombre: ['', [Validators.required, Validators.maxLength(200)]],
      genero: ['', [Validators.required]],
      fechaEstreno: ['', [Validators.required, fechaFutura]],
      fechaSalida: ['', [Validators.required, fechaFutura]],
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

  private readonly initLoad = afterNextRender(() => this.cargarPeliculas());

  readonly resumenCartelera = signal<{ desde: string; hasta: string; dias: number } | null>(null);

  constructor() {
    this.form.controls.rutaImagen.valueChanges.subscribe(() => this.errorPreview.set(false));
    this.form.valueChanges.subscribe(() => this.actualizarResumenCartelera());
    this.actualizarResumenCartelera();
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

  cargarPeliculas(): void {
    this.cargando.set(true);
    this.peliculaService.listarTodas().subscribe({
      next: (peliculas) => {
        this.peliculas.set(peliculas);
        this.cargando.set(false);
      },
      error: (error) => {
        this.errorCarga.set(getErrorMessage(error, 'No se pudieron cargar las películas.'));
        this.cargando.set(false);
      },
    });
  }

  guardar(): void {
    this.limpiarErrores();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.peliculaService.crear(this.construirPayload()).subscribe({
      next: (guardada) => {
        this.guardando.set(false);
        this.toastr.success('Película creada correctamente', 'Éxito');

        const url = (this.form.controls.rutaImagen.value ?? '').trim();
        this.resetFormulario();
        this.cargarPeliculas();

        if (guardada.id && this.esUrlHttp(url)) {
          this.importarImagenDesdeUrl(guardada.id, url, true);
        } else if (guardada.id) {
          this.router.navigate(['/admin/peliculas', guardada.id, 'editar']);
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

  editar(pelicula: Pelicula): void {
    if (!pelicula.id) return;
    this.router.navigate(['/admin/peliculas', pelicula.id, 'editar']);
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

  onPreviewError(): void {
    this.errorPreview.set(true);
  }

  esInvalido(campo: string): boolean {
    const control = this.form.get(campo);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  private importarImagenDesdeUrl(id: number, url: string, irAEditar: boolean): void {
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
      .then(
        (archivo) =>
          new Promise<void>((resolve, reject) => {
            this.peliculaService.subirImagen(id, archivo).subscribe({
              next: (event) => {
                if (event.type === HttpEventType.Response) {
                  this.toastr.success('Póster guardado correctamente', 'Éxito');
                  resolve();
                }
              },
              error: (error) => reject(error),
            });
          })
      )
      .catch(() => {
        this.toastr.warning(
          'La película se creó, pero la imagen no. Podés subirla en la edición.',
          'Póster'
        );
      })
      .finally(() => {
        if (irAEditar) {
          this.router.navigate(['/admin/peliculas', id, 'editar']);
        }
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

  private resetFormulario(): void {
    this.errorPreview.set(false);
    this.errorMensaje.set('');
    this.form.reset({
      nombre: '',
      genero: '',
      fechaEstreno: '',
      fechaSalida: '',
      duracionMinutos: 120,
      sinopsis: this.sinopsisPorDefecto,
      descripcion: '',
      director: '',
      elenco: '',
      clasificacion: '',
      nominaciones: '',
      urlTrailer: '',
      rutaImagen: '',
    });
    this.limpiarErrores();
  }

  private limpiarErrores(): void {
    limpiarErroresDeCampos(this.form);
    this.errorMensaje.set('');
  }
}

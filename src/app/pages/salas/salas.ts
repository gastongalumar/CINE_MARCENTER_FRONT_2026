import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { distinctUntilChanged, map } from 'rxjs';

import { SalaService } from '../../services/sala';
import { Sala, SalaRequest } from '../../models/sala';
import { getErrorMessage } from '../../utils/api-error';
import { aplicarErroresDeCampos, esControlInvalido, limpiarErroresDeCampos } from '../../utils/form-error';

/** Capacidad total: mínimo 50 y máximo 320 butacas (convive con max filas/columnas). */
function capacidadValida(group: AbstractControl): ValidationErrors | null {
  const filas = Number(group.get('filas')?.value);
  const columnas = Number(group.get('columnas')?.value);
  if (!filas || !columnas) return null;
  const capacidad = filas * columnas;
  if (capacidad < 50) return { capacidadMinima: true };
  if (capacidad > 320) return { capacidad: true };
  return null;
}

@Component({
  selector: 'app-salas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './salas.html',
  styleUrls: ['../../styles/admin-panel.shared.css', './salas.css'],
})
export class SalasComponent {
  private readonly salaService = inject(SalaService);
  private readonly toastr = inject(ToastrService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly salaSeleccionada = signal<Sala | null>(null);
  readonly guardando = signal(false);
  readonly errorMensaje = signal('');

  private readonly valores = signal<{
    nombre: string | null;
    filas: number | null;
    columnas: number | null;
  }>(this.formularioInicial());

  readonly form = this.fb.group(
    {
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      filas: [10, [Validators.required, Validators.min(1), Validators.max(20), Validators.pattern(/^\d+$/)]],
      columnas: [16, [Validators.required, Validators.min(1), Validators.max(16), Validators.pattern(/^\d+$/)]],
    },
    { validators: [capacidadValida] }
  );

  readonly filas = computed(() => Number(this.valores().filas) || 0);
  readonly columnas = computed(() => Number(this.valores().columnas) || 0);
  readonly capacidad = computed(() => this.filas() * this.columnas());
  readonly filasPreview = computed(() => Array.from({ length: Math.min(this.filas(), 20) }, (_, i) => i));
  readonly columnasPreview = computed(() => Array.from({ length: Math.min(this.columnas(), 16) }, (_, i) => i));

  constructor() {
    this.form.valueChanges.subscribe(() => this.valores.set(this.form.getRawValue()));

    this.route.queryParamMap
      .pipe(
        map((params) => params.get('id')),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((idParam) => this.cargarEdicionDesdeQuery(idParam));
  }

  guardar(): void {
    this.limpiarErrores();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.construirPayload();
    const seleccionada = this.salaSeleccionada();

    this.guardando.set(true);
    const peticion$ = seleccionada?.id
      ? this.salaService.actualizar(seleccionada.id, payload)
      : this.salaService.crear(payload);

    peticion$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.toastr.success(
          seleccionada ? 'Sala actualizada' : 'Sala creada correctamente',
          'Éxito'
        );
        this.cancelarEdicion();
      },
      error: (error) => {
        this.guardando.set(false);
        const mapeados = aplicarErroresDeCampos(this.form, error);
        this.errorMensaje.set(
          mapeados ? 'Revisá los campos marcados.' : getErrorMessage(error, 'No se pudo guardar la sala.')
        );
      },
    });
  }

  editar(sala: Sala): void {
    this.salaSeleccionada.set(sala);
    this.form.patchValue({
      nombre: sala.nombre,
      filas: sala.filas,
      columnas: sala.columnas,
    });
    this.valores.set(this.form.getRawValue());
    this.limpiarErrores();
    this.errorMensaje.set('');
  }

  cancelarEdicion(): void {
    this.salaSeleccionada.set(null);
    this.errorMensaje.set('');
    this.form.reset(this.formularioInicial());
    this.valores.set(this.form.getRawValue());
    this.limpiarErrores();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true,
    });
  }

  esInvalido(campo: string): boolean {
    return esControlInvalido(this.form.get(campo));
  }

  // ------------------------------------------------------------------ privados

  private cargarEdicionDesdeQuery(idParam: string | null): void {
    if (!idParam) {
      if (this.salaSeleccionada()) {
        this.salaSeleccionada.set(null);
        this.form.reset(this.formularioInicial());
        this.valores.set(this.form.getRawValue());
        this.limpiarErrores();
      }
      return;
    }

    const id = Number(idParam);
    if (!Number.isFinite(id) || id <= 0) {
      this.toastr.error('Identificador de sala inválido.', 'Error');
      this.limpiarQueryId();
      return;
    }

    if (this.salaSeleccionada()?.id === id) return;

    this.salaService.obtenerPorId(id).subscribe({
      next: (sala) => this.editar(sala),
      error: () => {
        this.limpiarQueryId();
      },
    });
  }

  private limpiarQueryId(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true,
    });
  }

  private formularioInicial() {
    return { nombre: '', filas: 10, columnas: 16 };
  }

  private construirPayload(): SalaRequest {
    const valores = this.form.getRawValue();
    return {
      nombre: (valores.nombre ?? '').trim(),
      filas: Number(valores.filas),
      columnas: Number(valores.columnas),
    };
  }

  private limpiarErrores(): void {
    limpiarErroresDeCampos(this.form);
    this.errorMensaje.set('');
  }
}

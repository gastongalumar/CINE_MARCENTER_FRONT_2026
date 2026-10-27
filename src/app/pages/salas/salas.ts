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
import { RouterModule } from '@angular/router';
// import { ToastrService } from 'ngx-toastr';

// import { SalaService } from '../../services/sala.service';
// import { ConfirmDialogService } from '../../services/confirm-dialog.service';
// import { Sala, SalaRequest } from '../../models/sala.model';
// import { getErrorMessage } from '../../utils/api-error.util';
// import { aplicarErroresDeCampos, limpiarErroresDeCampos } from '../../utils/form-error.util';

/** Capacidad total de la sala ≤ 320 butacas (CapacidadSalaValidator del backend). */
function capacidadValida(group: AbstractControl): ValidationErrors | null {
  const filas = Number(group.get('filas')?.value);
  const columnas = Number(group.get('columnas')?.value);
  if (!filas || !columnas) return null;
  return filas * columnas <= 320 ? null : { capacidad: true };
}

@Component({
  selector: 'app-salas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './salas.html',
  styleUrls: ['./salas.css'],
})
export class SalasComponent {
  private readonly salaService = inject(SalaService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toastr = inject(ToastrService);
  private readonly fb = inject(FormBuilder);

  readonly salas = signal<Sala[]>([]);
  readonly salaSeleccionada = signal<Sala | null>(null);
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly errorCarga = signal('');
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

  private readonly initLoad = afterNextRender(() => this.cargarSalas());

  constructor() {
    this.form.valueChanges.subscribe(() => this.valores.set(this.form.getRawValue()));
  }

  cargarSalas(): void {
    this.cargando.set(true);
    this.salaService.listarTodas().subscribe({
      next: (salas) => {
        this.salas.set(salas);
        this.cargando.set(false);
      },
      error: (error) => {
        this.errorCarga.set(getErrorMessage(error, 'No se pudieron cargar las salas.'));
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
        this.cargarSalas();
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

  eliminar(sala: Sala): void {
    if (!sala.id) return;

    this.confirmDialog
      .confirmDanger(
        'Eliminar sala',
        `¿Seguro que querés eliminar «${sala.nombre}»? También se perderán sus butacas y funciones asociadas.`
      )
      .subscribe((confirmado) => {
        if (!confirmado) return;

        this.salaService.eliminar(sala.id!).subscribe({
          next: () => {
            this.toastr.success('Sala eliminada', 'Éxito');
            if (this.salaSeleccionada()?.id === sala.id) {
              this.cancelarEdicion();
            }
            this.cargarSalas();
          },
        });
      });
  }

  cancelarEdicion(): void {
    this.salaSeleccionada.set(null);
    this.errorMensaje.set('');
    this.form.reset(this.formularioInicial());
    this.valores.set(this.form.getRawValue());
    this.limpiarErrores();
  }

  capacidadDe(sala: Sala): number {
    return sala.capacidad ?? sala.filas * sala.columnas;
  }

  esInvalido(campo: string): boolean {
    const control = this.form.get(campo);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  // ------------------------------------------------------------------ privados

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

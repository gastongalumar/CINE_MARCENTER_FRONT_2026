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
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { FuncionService } from '../../services/funcion';
import { PeliculaService } from '../../services/pelicula';
import { SalaService } from '../../services/sala';
import { FuncionRangoRequest, FuncionRequest } from '../../models/funcion';
import { Pelicula } from '../../models/pelicula';
import { Sala } from '../../models/sala';
import { getErrorMessage } from '../../utils/api-error';
import { aplicarErroresDeCampos, esControlInvalido, limpiarErroresDeCampos } from '../../utils/form-error';
import {
  PreviewHorariosDia,
  calcularHorariosPorDia,
  diasInclusive,
  fechaLocalIso,
  formatearFechaCorta,
  horaLocalIso,
} from '../../utils/datetime';
import { CineDatePickerComponent } from '../../components/cine-date-picker/cine-date-picker';
import { CineTimePickerComponent } from '../../components/cine-time-picker/cine-time-picker';

type ModoCreacion = 'individual' | 'rango';

/** La fecha desde del rango no puede ser pasada (@FutureOrPresent). */
function fechaNoPasada(control: AbstractControl): ValidationErrors | null {
  const valor = control.value as string | null;
  if (!valor) return null;
  return valor >= fechaLocalIso() ? null : { fechaPasada: true };
}

/** Réplica de RangoFuncionesValidator: hasta ≥ desde y horaFin > horaInicio. */
function rangoConsistente(group: AbstractControl): ValidationErrors | null {
  const desde = group.get('fechaDesde')?.value as string | null;
  const hasta = group.get('fechaHasta')?.value as string | null;
  if (desde && hasta && hasta < desde) return { fechasInvertidas: true };

  const inicio = group.get('horaInicio')?.value as string | null;
  const fin = group.get('horaFin')?.value as string | null;
  if (inicio && fin && fin <= inicio) return { horasInvertidas: true };

  return null;
}

@Component({
  selector: 'app-funciones',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    CineDatePickerComponent,
    CineTimePickerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './funciones.html',
  styleUrls: ['./funciones.css', '../../styles/cine-picker.shared.css'],
})
export class FuncionesComponent {
  private readonly funcionService = inject(FuncionService);
  private readonly peliculaService = inject(PeliculaService);
  private readonly salaService = inject(SalaService);
  private readonly toastr = inject(ToastrService);
  private readonly fb = inject(FormBuilder);

  readonly peliculas = signal<Pelicula[]>([]);
  readonly salas = signal<Sala[]>([]);
  readonly modo = signal<ModoCreacion>('individual');
  readonly cargando = signal(true);
  readonly creando = signal(false);
  readonly creandoRango = signal(false);
  readonly errorIndividual = signal('');
  readonly errorRango = signal('');

  private readonly rangoValores = signal<{
    peliculaId: number | null;
    salaId: number | null;
    fechaDesde: string | null;
    fechaHasta: string | null;
    horaInicio: string | null;
    horaFin: string | null;
    precio: number | null;
  }>(this.formularioRangoInicial());

  readonly formIndividual = this.fb.group({
    peliculaId: [null as number | null, [Validators.required, Validators.min(1)]],
    salaId: [null as number | null, [Validators.required, Validators.min(1)]],
    fecha: [fechaLocalIso(), [Validators.required]],
    hora: [horaLocalIso(), [Validators.required]],
    precio: [5000, [Validators.required, Validators.min(1), Validators.max(999999.99)]],
  });

  readonly resumenFuncionIndividual = signal<string | null>(null);
  readonly resumenRangoFechas = signal<{ desde: string; hasta: string; dias: number } | null>(null);

  readonly formRango = this.fb.group(
    {
      peliculaId: [null as number | null, [Validators.required, Validators.min(1)]],
      salaId: [null as number | null, [Validators.required, Validators.min(1)]],
      fechaDesde: [fechaLocalIso(), [Validators.required, fechaNoPasada]],
      fechaHasta: [fechaLocalIso(), [Validators.required]],
      horaInicio: ['10:00', [Validators.required]],
      horaFin: ['23:00', [Validators.required]],
      precio: [5000, [Validators.required, Validators.min(1), Validators.max(999999.99)]],
    },
    { validators: [rangoConsistente] }
  );

  readonly peliculaRangoSeleccionada = computed(() => {
    const id = Number(this.rangoValores().peliculaId);
    return this.peliculas().find((p) => p.id === id) ?? null;
  });

  readonly previewRango = computed<PreviewHorariosDia>(() => {
    const pelicula = this.peliculaRangoSeleccionada();
    const { horaInicio, horaFin } = this.rangoValores();
    if (!pelicula?.duracionMinutos || !horaInicio || !horaFin || horaFin <= horaInicio) {
      return { inicios: [] };
    }
    return calcularHorariosPorDia(horaInicio, horaFin, pelicula.duracionMinutos);
  });

  private readonly initLoad = afterNextRender(() => this.cargarDatos());

  constructor() {
    this.formRango.valueChanges.subscribe(() => {
      this.rangoValores.set(this.formRango.getRawValue());
      this.actualizarResumenRango();
    });
    this.formIndividual.valueChanges.subscribe(() => this.actualizarResumenIndividual());
    this.actualizarResumenIndividual();
    this.actualizarResumenRango();
  }

  private actualizarResumenIndividual(): void {
    const fecha = this.formIndividual.controls.fecha.value;
    const hora = this.formIndividual.controls.hora.value;
    if (!fecha || !hora) {
      this.resumenFuncionIndividual.set(null);
      return;
    }
    this.resumenFuncionIndividual.set(`${formatearFechaCorta(fecha)} · ${hora} hs`);
  }

  private actualizarResumenRango(): void {
    const desde = this.formRango.controls.fechaDesde.value;
    const hasta = this.formRango.controls.fechaHasta.value;
    const dias = diasInclusive(desde ?? '', hasta ?? '');
    if (!desde || !hasta || dias == null) {
      this.resumenRangoFechas.set(null);
      return;
    }
    this.resumenRangoFechas.set({
      desde: formatearFechaCorta(desde),
      hasta: formatearFechaCorta(hasta),
      dias,
    });
  }

  cambiarModo(modo: ModoCreacion): void {
    this.modo.set(modo);
    this.errorIndividual.set('');
    this.errorRango.set('');
  }

  cargarDatos(): void {
    this.cargando.set(true);
    this.limpiarErrores(this.formIndividual);
    this.limpiarErrores(this.formRango);

    this.peliculaService.listarTodas().subscribe({
      next: (peliculas) => {
        this.peliculas.set(peliculas);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });

    this.salaService.listarTodas().subscribe({
      next: (salas) => this.salas.set(salas),
    });
  }

  crearFuncion(): void {
    this.limpiarErrores(this.formIndividual);
    if (this.formIndividual.invalid) {
      this.formIndividual.markAllAsTouched();
      return;
    }

    const valores = this.formIndividual.getRawValue();
    const horario = `${valores.fecha ?? ''}T${valores.hora ?? ''}`;
    const payload: FuncionRequest = {
      peliculaId: Number(valores.peliculaId),
      salaId: Number(valores.salaId),
      horario: this.formatearHorario(horario),
      precio: Number(valores.precio),
    };

    this.creando.set(true);
    this.funcionService.crear(payload).subscribe({
      next: () => {
        this.creando.set(false);
        this.toastr.success('Función creada correctamente', 'Éxito');
        this.formIndividual.reset({
          peliculaId: null,
          salaId: null,
          fecha: fechaLocalIso(),
          hora: horaLocalIso(),
          precio: 5000,
        });
      },
      error: (error) => {
        this.creando.set(false);
        const mapeados = aplicarErroresDeCampos(this.formIndividual, error, {
          horario: 'fecha',
        });
        this.errorIndividual.set(
          mapeados ? 'Revisá los campos marcados.' : getErrorMessage(error, 'No se pudo crear la función.')
        );
      },
    });
  }

  crearPorRango(): void {
    this.limpiarErrores(this.formRango);
    if (this.formRango.invalid) {
      this.formRango.markAllAsTouched();
      return;
    }

    const valores = this.formRango.getRawValue();
    const payload: FuncionRangoRequest = {
      peliculaId: Number(valores.peliculaId),
      salaId: Number(valores.salaId),
      fechaDesde: valores.fechaDesde ?? '',
      fechaHasta: valores.fechaHasta ?? '',
      horaInicio: this.formatearHora(valores.horaInicio ?? ''),
      horaFin: this.formatearHora(valores.horaFin ?? ''),
      precio: Number(valores.precio),
    };

    this.creandoRango.set(true);
    this.funcionService.crearPorRango(payload).subscribe({
      next: (creadas) => {
        this.creandoRango.set(false);
        this.toastr.success(`${creadas.length} función(es) creada(s) correctamente`, 'Éxito');
      },
      error: (error) => {
        this.creandoRango.set(false);
        const mapeados = aplicarErroresDeCampos(this.formRango, error);
        this.errorRango.set(
          mapeados
            ? 'Revisá los campos marcados.'
            : getErrorMessage(error, 'No se pudieron generar las funciones.')
        );
      },
    });
  }

  esInvalido(form: FormGroup, campo: string): boolean {
    return esControlInvalido(form.get(campo));
  }

  // ------------------------------------------------------------------ privados

  private formularioRangoInicial() {
    return {
      peliculaId: null as number | null,
      salaId: null as number | null,
      fechaDesde: fechaLocalIso(),
      fechaHasta: fechaLocalIso(),
      horaInicio: '10:00',
      horaFin: '23:00',
      precio: 5000,
    };
  }

  private formatearHorario(horario: string): string {
    if (!horario) return horario;
    return horario.length === 16 ? `${horario}:00` : horario;
  }

  private formatearHora(hora: string): string {
    if (!hora) return hora;
    return hora.length === 5 ? `${hora}:00` : hora;
  }

  private limpiarErrores(form: FormGroup): void {
    limpiarErroresDeCampos(form);
    this.errorIndividual.set('');
    this.errorRango.set('');
  }
}

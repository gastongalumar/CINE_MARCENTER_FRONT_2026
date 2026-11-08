import {
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NgControl,
} from '@angular/forms';
import { fechaLocalIso, formatearFechaCorta } from '../../utils/datetime';

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

interface CeldaDia {
  fecha: Date;
  dia: number;
  fueraMes: boolean;
  iso: string;
}

@Component({
  selector: 'app-cine-date-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cine-date-picker.html',
  styleUrls: ['./cine-date-picker.css'],
})
export class CineDatePickerComponent implements ControlValueAccessor {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  readonly label = input('');
  readonly placeholder = input('Elegir fecha');
  readonly icon = input('event');
  readonly min = input<string | null>(null);
  readonly max = input<string | null>(null);

  readonly abierto = signal(false);
  readonly valorIso = signal<string | null>(null);
  readonly vista = signal(new Date());
  readonly deshabilitado = signal(false);

  private onChange: (value: string | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  readonly diasSemana = DIAS_SEMANA;

  readonly etiquetaVisible = computed(() => {
    const iso = this.valorIso();
    return iso ? formatearFechaCorta(iso) : this.placeholder();
  });

  readonly tituloMes = computed(() => {
    const v = this.vista();
    return `${MESES[v.getMonth()]} ${v.getFullYear()}`;
  });

  readonly celdas = computed<CeldaDia[]>(() => this.armarCeldas(this.vista()));

  get esInvalido(): boolean {
    const control = this.ngControl?.control;
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  @HostBinding('class.cdp-host-open')
  get hostOpen(): boolean {
    return this.abierto();
  }

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  writeValue(value: string | null): void {
    const iso = value && value.length >= 10 ? value.slice(0, 10) : null;
    this.valorIso.set(iso);
    if (iso) {
      const [y, m, d] = iso.split('-').map(Number);
      this.vista.set(new Date(y, m - 1, d));
    }
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.deshabilitado.set(isDisabled);
  }

  toggle(): void {
    if (this.deshabilitado()) return;
    const next = !this.abierto();
    this.abierto.set(next);
    if (next) {
      const iso = this.valorIso();
      if (iso) {
        const [y, m, d] = iso.split('-').map(Number);
        this.vista.set(new Date(y, m - 1, d));
      } else {
        this.vista.set(new Date());
      }
    } else {
      this.onTouched();
    }
  }

  cerrar(): void {
    if (!this.abierto()) return;
    this.abierto.set(false);
    this.onTouched();
  }

  mesAnterior(event: Event): void {
    event.stopPropagation();
    const v = this.vista();
    this.vista.set(new Date(v.getFullYear(), v.getMonth() - 1, 1));
  }

  mesSiguiente(event: Event): void {
    event.stopPropagation();
    const v = this.vista();
    this.vista.set(new Date(v.getFullYear(), v.getMonth() + 1, 1));
  }

  seleccionar(celda: CeldaDia, event: Event): void {
    event.stopPropagation();
    if (this.estaDeshabilitada(celda.iso)) return;
    this.valorIso.set(celda.iso);
    this.onChange(celda.iso);
    this.cerrar();
  }

  irAHoy(event: Event): void {
    event.stopPropagation();
    const hoy = fechaLocalIso();
    if (this.estaDeshabilitada(hoy)) return;
    this.valorIso.set(hoy);
    this.onChange(hoy);
    const [y, m, d] = hoy.split('-').map(Number);
    this.vista.set(new Date(y, m - 1, d));
    this.cerrar();
  }

  borrar(event: Event): void {
    event.stopPropagation();
    this.valorIso.set(null);
    this.onChange(null);
    this.cerrar();
  }

  esSeleccionada(iso: string): boolean {
    return this.valorIso() === iso;
  }

  esHoy(iso: string): boolean {
    return iso === fechaLocalIso();
  }

  estaDeshabilitada(iso: string): boolean {
    const min = this.min();
    const max = this.max();
    if (min && iso < min) return true;
    if (max && iso > max) return true;
    return false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.abierto()) return;
    const target = event.target as Node | null;
    if (target && !this.host.nativeElement.contains(target)) {
      this.cerrar();
    }
  }

  private armarCeldas(vista: Date): CeldaDia[] {
    const year = vista.getFullYear();
    const month = vista.getMonth();
    const primero = new Date(year, month, 1);
    // Lunes = 0 … Domingo = 6
    const offset = (primero.getDay() + 6) % 7;
    const inicio = new Date(year, month, 1 - offset);
    const celdas: CeldaDia[] = [];

    for (let i = 0; i < 42; i++) {
      const fecha = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i);
      celdas.push({
        fecha,
        dia: fecha.getDate(),
        fueraMes: fecha.getMonth() !== month,
        iso: fechaLocalIso(fecha),
      });
    }
    return celdas;
  }
}

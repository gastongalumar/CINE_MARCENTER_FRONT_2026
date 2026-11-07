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

@Component({
  selector: 'app-cine-time-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cine-time-picker.html',
  styleUrls: ['./cine-time-picker.css'],
})
export class CineTimePickerComponent implements ControlValueAccessor {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  readonly label = input('');
  readonly placeholder = input('Elegir hora');
  readonly icon = input('schedule');
  /** Intervalo de minutos (1, 5, 15…). */
  readonly stepMinutos = input(5);

  readonly abierto = signal(false);
  readonly hora = signal('12');
  readonly minuto = signal('00');
  readonly tieneValor = signal(false);
  readonly deshabilitado = signal(false);

  private onChange: (value: string | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  readonly horas = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  readonly minutos = computed(() => {
    const step = Math.max(1, this.stepMinutos());
    const list: string[] = [];
    for (let m = 0; m < 60; m += step) {
      list.push(String(m).padStart(2, '0'));
    }
    return list;
  });

  readonly etiquetaVisible = computed(() => {
    if (!this.tieneValor()) return this.placeholder();
    return `${this.hora()}:${this.minuto()} hs`;
  });

  get esInvalido(): boolean {
    const control = this.ngControl?.control;
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  @HostBinding('class.ctp-host-open')
  get hostOpen(): boolean {
    return this.abierto();
  }

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  writeValue(value: string | null): void {
    if (!value) {
      this.tieneValor.set(false);
      return;
    }
    const match = value.match(/^(\d{1,2}):(\d{2})/);
    if (!match) {
      this.tieneValor.set(false);
      return;
    }
    this.hora.set(String(Number(match[1])).padStart(2, '0'));
    this.minuto.set(this.ajustarMinuto(match[2]));
    this.tieneValor.set(true);
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
    if (!next) this.onTouched();
  }

  cerrar(): void {
    if (!this.abierto()) return;
    this.abierto.set(false);
    this.onTouched();
  }

  elegirHora(h: string, event: Event): void {
    event.stopPropagation();
    this.hora.set(h);
    this.emitir();
  }

  elegirMinuto(m: string, event: Event): void {
    event.stopPropagation();
    this.minuto.set(m);
    this.emitir();
    this.cerrar();
  }

  borrar(event: Event): void {
    event.stopPropagation();
    this.tieneValor.set(false);
    this.onChange(null);
    this.cerrar();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.abierto()) return;
    const target = event.target as Node | null;
    if (target && !this.host.nativeElement.contains(target)) {
      this.cerrar();
    }
  }

  private emitir(): void {
    this.tieneValor.set(true);
    this.onChange(`${this.hora()}:${this.minuto()}`);
  }

  private ajustarMinuto(minuto: string): string {
    const step = Math.max(1, this.stepMinutos());
    const n = Number(minuto);
    if (Number.isNaN(n)) return '00';
    const rounded = Math.round(n / step) * step;
    const clamped = Math.min(55, rounded >= 60 ? 60 - step : rounded);
    return String(clamped).padStart(2, '0');
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/** Estado visual de un asiento. */
export type EstadoAsiento = 'libre' | 'seleccionada' | 'bloqueada' | 'ocupada';

/** Fila del mapa: letra de fila + número de asiento. */
export interface AsientoMapa {
  /** Etiqueta completa, p.ej. "A1" (coincide con el patrón del backend). */
  etiqueta: string;
  /** Letra de la fila, p.ej. "A". */
  fila: string;
  /** Número de columna, p.ej. 1. */
  columna: number;
  /** Estado actual del asiento. */
  estado: EstadoAsiento;
}

/**
 * Mapa interactivo de butacas.
 *
 * Componente **reutilizable** y sin dependencias de negocio: recibe la
 * geometría de la sala y el estado de los asientos, y emite los cambios de
 * selección. Se usa tanto en el flujo de compra del cliente como en la
 * vista de ocupación del administrador (modo sólo lectura).
 */
@Component({
  selector: 'app-seat-map',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './seat-map.html',
  styleUrls: ['./seat-map.css'],
})
export class SeatMapComponent {
  /** Cantidad de filas de la sala (letras A, B, C...). */
  @Input() set filas(value: number) {
    this._filas = Math.max(0, Math.min(20, Number(value) || 0));
    this.recalcular();
  }

  /** Cantidad de columnas de la sala. */
  @Input() set columnas(value: number) {
    this._columnas = Math.max(0, Math.min(99, Number(value) || 0));
    this.recalcular();
  }

  /** Etiquetas de los asientos ya reservados (p.ej. ["A1", "A2"]). */
  @Input() set ocupados(value: string[] | null | undefined) {
    this._ocupados = new Set((value ?? []).map((v) => v.toUpperCase()));
    this.recalcular();
  }

  /** Etiquetas de asientos retenidos por otros clientes. */
  @Input() set bloqueados(value: string[] | null | undefined) {
    this._bloqueados = new Set((value ?? []).map((v) => v.toUpperCase()));
    this.recalcular();
  }

  /** Etiquetas de los asientos seleccionados por el usuario. */
  @Input() set seleccionados(value: string[] | null | undefined) {
    this._seleccionados = new Set((value ?? []).map((v) => v.toUpperCase()));
    this.recalcular();
  }

  /** Modo sólo lectura (vista de ocupación para administradores). */
  @Input() soloLectura = false;

  /** Emite el nuevo listado de asientos seleccionados. */
  @Output() readonly seleccionChange = new EventEmitter<string[]>();

  private _filas = 0;
  private _columnas = 0;
  private _ocupados = new Set<string>();
  private _bloqueados = new Set<string>();
  private _seleccionados = new Set<string>();

  /** Versión reactiva para forzar el recálculo de las filas. */
  private readonly version = signal(0);

  readonly columnasIzquierda = computed<number[]>(() => {
    this.version();
    const mitad = Math.ceil(this._columnas / 2);
    return Array.from({ length: mitad }, (_, i) => i + 1);
  });

  readonly columnasDerecha = computed<number[]>(() => {
    this.version();
    const mitad = Math.ceil(this._columnas / 2);
    return Array.from({ length: this._columnas - mitad }, (_, i) => mitad + i + 1);
  });

  /** Filas del mapa con sus asientos, partida por el pasillo central. */
  readonly filasMapa = computed<{ letra: string; izquierda: AsientoMapa[]; derecha: AsientoMapa[] }[]>(() => {
    this.version();
    const mitad = Math.ceil(this._columnas / 2);

    return Array.from({ length: this._filas }, (_, i) => {
      const letra = String.fromCharCode(65 + i);
      const izquierda: AsientoMapa[] = [];
      const derecha: AsientoMapa[] = [];

      for (let c = 1; c <= this._columnas; c++) {
        const etiqueta = `${letra}${c}`;
        const asiento: AsientoMapa = {
          etiqueta,
          fila: letra,
          columna: c,
          estado: this.estadoDe(etiqueta),
        };
        if (c <= mitad) izquierda.push(asiento);
        else derecha.push(asiento);
      }

      return { letra, izquierda, derecha };
    });
  });

  /** Alterna la selección de un asiento disponible. */
  alternar(etiqueta: string): void {
    const clave = etiqueta.toUpperCase();
    if (this.soloLectura || this._ocupados.has(clave) || this._bloqueados.has(clave)) return;

    const nueva = new Set(this._seleccionados);

    if (nueva.has(clave)) {
      nueva.delete(clave);
    } else {
      nueva.add(clave);
    }

    this._seleccionados = nueva;
    this.recalcular();
    this.seleccionChange.emit([...nueva].sort());
  }

  private estadoDe(etiqueta: string): EstadoAsiento {
    const clave = etiqueta.toUpperCase();
    if (this._ocupados.has(clave)) return 'ocupada';
    if (this._seleccionados.has(clave)) return 'seleccionada';
    if (this._bloqueados.has(clave)) return 'bloqueada';
    return 'libre';
  }

  private recalcular(): void {
    this.version.update((v) => v + 1);
  }
}

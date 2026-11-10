import { Injectable } from '@angular/core';

/** Máximo de entradas permitidas en una sola compra. */
export const MAX_ENTRADAS_COMPRA = 20;

/**
 * Estado compartido del flujo de compra entre rutas
 * (horarios → asientos → pago).
 */
@Injectable({
  providedIn: 'root',
})
export class CompraFlujoService {
  peliculaId: number | null = null;
  funcionId: number | null = null;
  asientosSeleccionados: string[] = [];

  /** Si true, al destruir asientos no se liberan holds (navegación a pago). */
  private preservarHolds = false;

  setContexto(peliculaId: number, funcionId: number | null): void {
    this.peliculaId = peliculaId;
    this.funcionId = funcionId;
  }

  setSeleccion(asientos: string[]): void {
    this.asientosSeleccionados = asientos.map((e) => e.trim().toUpperCase()).sort();
  }

  tieneSeleccionPara(funcionId: number): boolean {
    return this.funcionId === funcionId && this.asientosSeleccionados.length > 0;
  }

  marcarNavegacionAPago(): void {
    this.preservarHolds = true;
  }

  /** Consume el flag (una sola vez). */
  consumirPreservarHolds(): boolean {
    const valor = this.preservarHolds;
    this.preservarHolds = false;
    return valor;
  }

  clearSeleccion(): void {
    this.asientosSeleccionados = [];
  }

  clear(): void {
    this.preservarHolds = false;
    this.asientosSeleccionados = [];
    this.funcionId = null;
  }
}

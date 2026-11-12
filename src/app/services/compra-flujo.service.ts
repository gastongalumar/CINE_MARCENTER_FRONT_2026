import { Injectable } from '@angular/core';

/** Máximo de entradas permitidas en una sola compra. */
export const MAX_ENTRADAS_COMPRA = 20;

/** Clave de sessionStorage para sobrevivir F5 en el flujo de compra. */
const STORAGE_KEY = 'cine.compra.flujo';

interface CompraFlujoPersistido {
  peliculaId: number | null;
  funcionId: number | null;
  asientosSeleccionados: string[];
}

/**
 * Estado compartido del flujo de compra entre rutas
 * (horarios → asientos → pago).
 *
 * Persiste selección en sessionStorage para que F5 en `/pago` no pierda el contexto.
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

  constructor() {
    this.rehidratar();
  }

  setContexto(peliculaId: number, funcionId: number | null): void {
    this.peliculaId = peliculaId;
    this.funcionId = funcionId;
    this.persistir();
  }

  setSeleccion(asientos: string[]): void {
    this.asientosSeleccionados = asientos.map((e) => e.trim().toUpperCase()).sort();
    this.persistir();
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
    this.persistir();
  }

  clear(): void {
    this.preservarHolds = false;
    this.asientosSeleccionados = [];
    this.funcionId = null;
    this.peliculaId = null;
    this.limpiarStorage();
  }

  private persistir(): void {
    const payload: CompraFlujoPersistido = {
      peliculaId: this.peliculaId,
      funcionId: this.funcionId,
      asientosSeleccionados: this.asientosSeleccionados,
    };
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // sessionStorage puede no estar disponible
    }
  }

  private limpiarStorage(): void {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // sessionStorage puede no estar disponible
    }
  }

  private rehidratar(): void {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as CompraFlujoPersistido;
      this.peliculaId =
        typeof data.peliculaId === 'number' && Number.isFinite(data.peliculaId)
          ? data.peliculaId
          : null;
      this.funcionId =
        typeof data.funcionId === 'number' && Number.isFinite(data.funcionId)
          ? data.funcionId
          : null;
      this.asientosSeleccionados = Array.isArray(data.asientosSeleccionados)
        ? data.asientosSeleccionados
            .filter((e): e is string => typeof e === 'string')
            .map((e) => e.trim().toUpperCase())
            .sort()
        : [];
    } catch {
      this.limpiarStorage();
    }
  }
}

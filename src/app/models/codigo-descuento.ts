export type TipoDescuento = 'PORCENTAJE' | 'MONTO_FIJO';

export interface CodigoDescuento {
  id: number;
  codigo: string;
  tipo: TipoDescuento;
  valor: number;
  activo: boolean;
  usosMaximos?: number | null;
  usosActuales: number;
  vigenteDesde?: string | null;
  vigenteHasta?: string | null;
  descripcion?: string | null;
}

export interface CodigoDescuentoRequest {
  codigo: string;
  tipo: TipoDescuento;
  valor: number;
  activo?: boolean;
  usosMaximos?: number | null;
  vigenteDesde?: string | null;
  vigenteHasta?: string | null;
  descripcion?: string | null;
}

export interface ValidarCodigoResponse {
  valido: boolean;
  mensaje: string;
  codigo?: string;
  tipo?: TipoDescuento;
  valor?: number;
  descuentoMonto: number;
  totalConDescuento?: number | null;
}

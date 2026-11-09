export interface CandyCombo {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  icono?: string;
  activo: boolean;
}

export interface CandyComboRequest {
  nombre: string;
  descripcion?: string;
  precio: number;
  icono?: string;
  activo?: boolean;
}

export interface ComboSeleccionado {
  comboId: number;
  cantidad: number;
}

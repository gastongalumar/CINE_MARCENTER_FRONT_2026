/** Métodos de pago aceptados por el backend (enum MetodoPago). */
export enum MetodoPago {
  EFECTIVO = 'EFECTIVO',
  TARJETA = 'TARJETA',
  MERCADO_PAGO = 'MERCADO_PAGO',
  TRANSFERENCIA = 'TRANSFERENCIA',
}

export interface MetodoPagoOpcion {
  valor: MetodoPago;
  etiqueta: string;
  descripcion: string;
  icono: string;
}

export const METODOS_PAGO: MetodoPagoOpcion[] = [
  {
    valor: MetodoPago.MERCADO_PAGO,
    etiqueta: 'Mercado Pago',
    descripcion: 'Pago online con Checkout Pro (tarjeta, débito o efectivo)',
    icono: 'qr_code_scanner',
  },
  {
    valor: MetodoPago.EFECTIVO,
    etiqueta: 'Efectivo',
    descripcion: 'Abonás en ventanilla al retirar el ticket',
    icono: 'payments',
  },
  {
    valor: MetodoPago.TARJETA,
    etiqueta: 'Tarjeta',
    descripcion: 'Crédito o débito en la sucursal',
    icono: 'credit_card',
  },
  {
    valor: MetodoPago.TRANSFERENCIA,
    etiqueta: 'Transferencia',
    descripcion: 'Transferencia bancaria previa',
    icono: 'account_balance',
  },
];

import { ClaseEstadoReservaPipe, EstadoReservaPipe } from './estado-reserva';
import { EstadoReserva } from '../models/estado-reserva';

describe('EstadoReservaPipe', () => {
  const pipe = new EstadoReservaPipe();

  it('traduce estados conocidos', () => {
    expect(pipe.transform(EstadoReserva.CONFIRMADA)).toBe('Confirmada');
    expect(pipe.transform('PENDIENTE')).toBe('Pendiente');
    expect(pipe.transform(EstadoReserva.REEMBOLSADA)).toBe('Reembolsada');
  });

  it('null/undefined → guión', () => {
    expect(pipe.transform(null)).toBe('—');
    expect(pipe.transform(undefined)).toBe('—');
  });

  it('desconocido se deja tal cual', () => {
    expect(pipe.transform('OTRO')).toBe('OTRO');
  });
});

describe('ClaseEstadoReservaPipe', () => {
  const pipe = new ClaseEstadoReservaPipe();

  it('mapea clases bootstrap', () => {
    expect(pipe.transform(EstadoReserva.CONFIRMADA)).toBe('bg-primary');
    expect(pipe.transform(EstadoReserva.VALIDADA)).toBe('bg-success');
    expect(pipe.transform(EstadoReserva.CANCELADA)).toBe('bg-danger');
  });

  it('fallback bg-secondary', () => {
    expect(pipe.transform(null)).toBe('bg-secondary');
    expect(pipe.transform('XYZ')).toBe('bg-secondary');
  });
});

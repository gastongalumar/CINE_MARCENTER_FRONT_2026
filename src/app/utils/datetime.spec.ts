import {
  calcularHorariosPorDia,
  diasInclusive,
  fechaHoraLocalIso,
  fechaLocalIso,
  formatearFechaCorta,
  horaLocalIso,
  minutosAHora,
  parseApiDateTime,
  parseHoraAMinutos,
} from './datetime';

describe('datetime utils', () => {
  it('fechaLocalIso / horaLocalIso / fechaHoraLocalIso sin UTC shift', () => {
    const d = new Date(2026, 5, 15, 20, 5, 0);
    expect(fechaLocalIso(d)).toBe('2026-06-15');
    expect(horaLocalIso(d)).toBe('20:05');
    expect(fechaHoraLocalIso(d)).toBe('2026-06-15T20:05');
  });

  it('formatearFechaCorta', () => {
    expect(formatearFechaCorta('')).toBe('');
    expect(formatearFechaCorta('2026')).toBe('');
    const out = formatearFechaCorta('2026-10-24');
    expect(out.toLowerCase()).toContain('2026');
    expect(out).toMatch(/24/);
  });

  it('diasInclusive', () => {
    expect(diasInclusive('2026-01-01', '2026-01-01')).toBe(1);
    expect(diasInclusive('2026-01-01', '2026-01-03')).toBe(3);
    expect(diasInclusive('2026-01-03', '2026-01-01')).toBeNull();
    expect(diasInclusive('', '2026-01-01')).toBeNull();
  });

  it('parseApiDateTime conserva hora local del string', () => {
    const d = parseApiDateTime('2026-06-15T20:00:00');
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2026);
    expect(d!.getMonth()).toBe(5);
    expect(d!.getDate()).toBe(15);
    expect(d!.getHours()).toBe(20);
    expect(d!.getMinutes()).toBe(0);
    expect(parseApiDateTime('')).toBeNull();
  });

  it('parseHoraAMinutos / minutosAHora', () => {
    expect(parseHoraAMinutos('20:30')).toBe(20 * 60 + 30);
    expect(minutosAHora(125)).toBe('02:05');
    expect(minutosAHora(0)).toBe('00:00');
  });

  describe('calcularHorariosPorDia', () => {
    it('vacío con inputs inválidos', () => {
      expect(calcularHorariosPorDia('', '22:00', 120).inicios).toEqual([]);
      expect(calcularHorariosPorDia('18:00', '22:00', 0).inicios).toEqual([]);
    });

    it('genera inicios consecutivos que caben antes de horaFin', () => {
      const r = calcularHorariosPorDia('18:00', '22:00', 120);
      expect(r.inicios).toEqual(['18:00', '20:00']);
      expect(r.ultimoRechazado).toEqual({ inicio: '22:00', fin: '24:00' });
    });
  });
});

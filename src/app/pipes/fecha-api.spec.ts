import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
import { FechaApiPipe } from './fecha-api';

registerLocaleData(localeEsAr);

describe('FechaApiPipe', () => {
  const pipe = new FechaApiPipe();

  it('vacío → string vacío', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('formatea datetime API sin desfase', () => {
    expect(pipe.transform('2026-06-15T20:00:00')).toBe('15/06/2026 20:00');
  });

  it('acepta Date y formato custom', () => {
    const d = new Date(2026, 0, 5, 9, 30);
    expect(pipe.transform(d, 'dd/MM/yyyy')).toBe('05/01/2026');
  });

  it('valor no parseable se devuelve como string', () => {
    expect(pipe.transform('no-es-fecha')).toBe('no-es-fecha');
  });
});

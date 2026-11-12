import { esPeliculaNoPasada } from './pelicula-vigencia';

describe('esPeliculaNoPasada', () => {
  const hoy = '2026-06-15';

  it('incluye vigentes y estrenos futuros', () => {
    expect(esPeliculaNoPasada({ fechaSalida: '2026-06-15' }, hoy)).toBe(true);
    expect(esPeliculaNoPasada({ fechaSalida: '2026-12-01' }, hoy)).toBe(true);
  });

  it('excluye películas con fechaSalida anterior a hoy', () => {
    expect(esPeliculaNoPasada({ fechaSalida: '2026-06-14' }, hoy)).toBe(false);
    expect(esPeliculaNoPasada({ fechaSalida: '2020-01-01' }, hoy)).toBe(false);
  });

  it('rechaza fecha inválida o vacía', () => {
    expect(esPeliculaNoPasada({ fechaSalida: '' }, hoy)).toBe(false);
    expect(esPeliculaNoPasada({ fechaSalida: null }, hoy)).toBe(false);
  });
});

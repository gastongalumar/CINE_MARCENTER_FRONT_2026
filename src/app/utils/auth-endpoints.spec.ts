import { isPublicAuthEndpoint } from './auth-endpoints';

describe('isPublicAuthEndpoint', () => {
  it('marca login y registro como públicos', () => {
    expect(isPublicAuthEndpoint('http://localhost:8080/api/auth/login')).toBe(true);
    expect(isPublicAuthEndpoint('/api/auth/registro')).toBe(true);
  });

  it('NO marca forgot/reset/registro-admin como públicos (gap documentado)', () => {
    // Comportamiento actual: incompleto respecto a endpoints de auth públicos reales.
    expect(isPublicAuthEndpoint('/api/auth/forgot-password')).toBe(false);
    expect(isPublicAuthEndpoint('/api/auth/reset-password')).toBe(false);
    expect(isPublicAuthEndpoint('/api/auth/registro-admin')).toBe(false);
  });

  it('rechaza URLs que solo contienen el path como substring', () => {
    expect(isPublicAuthEndpoint('/api/auth/login/extra')).toBe(false);
    expect(isPublicAuthEndpoint('/api/peliculas')).toBe(false);
  });
});

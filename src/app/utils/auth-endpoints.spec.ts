import { isPublicAuthEndpoint } from './auth-endpoints';

describe('isPublicAuthEndpoint', () => {
  it('marca login y registro como públicos', () => {
    expect(isPublicAuthEndpoint('http://localhost:8080/api/auth/login')).toBe(true);
    expect(isPublicAuthEndpoint('/api/auth/registro')).toBe(true);
  });

  it('marca forgot/reset como públicos y deja registro-admin privado', () => {
    expect(isPublicAuthEndpoint('/api/auth/forgot-password')).toBe(true);
    expect(isPublicAuthEndpoint('/api/auth/reset-password')).toBe(true);
    expect(isPublicAuthEndpoint('/api/auth/registro-admin')).toBe(false);
  });

  it('rechaza URLs que solo contienen el path como substring', () => {
    expect(isPublicAuthEndpoint('/api/auth/login/extra')).toBe(false);
    expect(isPublicAuthEndpoint('/api/peliculas')).toBe(false);
  });
});

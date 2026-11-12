import { esStaff, parseTipoUsuario } from './auth';

describe('auth model helpers', () => {
  it('esStaff solo staff', () => {
    expect(esStaff('SUPERADMIN')).toBe(true);
    expect(esStaff('ADMINISTRADOR')).toBe(true);
    expect(esStaff('CLIENTE')).toBe(false);
    expect(esStaff(null)).toBe(false);
    expect(esStaff(undefined)).toBe(false);
  });

  it('parseTipoUsuario rechaza tipo desconocido o ausente', () => {
    expect(parseTipoUsuario('SUPERADMIN')).toBe('SUPERADMIN');
    expect(parseTipoUsuario('ADMINISTRADOR')).toBe('ADMINISTRADOR');
    expect(parseTipoUsuario('CLIENTE')).toBe('CLIENTE');
    expect(parseTipoUsuario('HACKER')).toBeNull();
    expect(parseTipoUsuario(null)).toBeNull();
    expect(parseTipoUsuario(undefined)).toBeNull();
  });
});

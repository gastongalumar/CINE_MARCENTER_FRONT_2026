import { esStaff, parseTipoUsuario } from './auth';

describe('auth model helpers', () => {
  it('esStaff solo staff', () => {
    expect(esStaff('SUPERADMIN')).toBe(true);
    expect(esStaff('ADMINISTRADOR')).toBe(true);
    expect(esStaff('CLIENTE')).toBe(false);
    expect(esStaff(null)).toBe(false);
    expect(esStaff(undefined)).toBe(false);
  });

  it('parseTipoUsuario default CLIENTE ante tipo desconocido (gap documentado)', () => {
    expect(parseTipoUsuario('SUPERADMIN')).toBe('SUPERADMIN');
    expect(parseTipoUsuario('ADMINISTRADOR')).toBe('ADMINISTRADOR');
    expect(parseTipoUsuario('CLIENTE')).toBe('CLIENTE');
    expect(parseTipoUsuario('HACKER')).toBe('CLIENTE');
    expect(parseTipoUsuario(null)).toBe('CLIENTE');
    expect(parseTipoUsuario(undefined)).toBe('CLIENTE');
  });
});

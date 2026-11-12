import { TestBed } from '@angular/core/testing';
import { Router, type UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { roleGuard } from './role';
import { AuthService } from '../services/auth';
import { createRouterMock } from '../../testing/router-mocks';
import type { TipoUsuario } from '../models/auth';

describe('roleGuard', () => {
  const router = createRouterMock();
  let isAuthenticated = signal(false);
  let role: TipoUsuario | null = null;

  beforeEach(() => {
    isAuthenticated = signal(false);
    role = null;
    router.createUrlTree.mockClear();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        {
          provide: AuthService,
          useValue: {
            isAuthenticated,
            tieneRol: (...roles: TipoUsuario[]) => !!role && roles.includes(role),
          },
        },
      ],
    });
  });

  function run(allowed: TipoUsuario[], url = '/admin') {
    const guard = roleGuard(...allowed);
    return TestBed.runInInjectionContext(() => guard({} as never, { url } as never));
  }

  it('sin sesión → login + returnUrl', () => {
    const result = run(['ADMINISTRADOR'], '/admin/peliculas') as UrlTree & {
      commands: unknown[];
      queryParams: Record<string, unknown>;
    };
    expect(result.commands).toEqual(['/login']);
    expect(result.queryParams).toEqual({ returnUrl: '/admin/peliculas' });
  });

  it('rol incorrecto → cartelera', () => {
    isAuthenticated.set(true);
    role = 'CLIENTE';
    const result = run(['ADMINISTRADOR', 'SUPERADMIN']) as UrlTree & { commands: unknown[] };
    expect(result.commands).toEqual(['/cartelera']);
  });

  it('ADMINISTRADOR pasa a rutas staff', () => {
    isAuthenticated.set(true);
    role = 'ADMINISTRADOR';
    expect(run(['ADMINISTRADOR', 'SUPERADMIN'])).toBe(true);
  });

  it('SUPERADMIN pasa a crear-admin', () => {
    isAuthenticated.set(true);
    role = 'SUPERADMIN';
    expect(run(['SUPERADMIN'], '/admin/crear-admin')).toBe(true);
  });

  it('ADMINISTRADOR no pasa a crear-admin solo-SUPERADMIN', () => {
    isAuthenticated.set(true);
    role = 'ADMINISTRADOR';
    const result = run(['SUPERADMIN'], '/admin/crear-admin') as UrlTree & { commands: unknown[] };
    expect(result.commands).toEqual(['/cartelera']);
  });
});

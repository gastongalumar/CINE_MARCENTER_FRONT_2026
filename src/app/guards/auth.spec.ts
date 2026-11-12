import { TestBed } from '@angular/core/testing';
import { Router, type UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { authGuard } from './auth';
import { AuthService } from '../services/auth';
import { createRouterMock } from '../../testing/router-mocks';

describe('authGuard', () => {
  const router = createRouterMock();
  let isAuthenticated = signal(false);

  beforeEach(() => {
    isAuthenticated = signal(false);
    router.createUrlTree.mockClear();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        {
          provide: AuthService,
          useValue: { isAuthenticated },
        },
      ],
    });
  });

  function run(url = '/mis-reservas') {
    return TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url } as never),
    );
  }

  it('permite acceso autenticado', () => {
    isAuthenticated.set(true);
    expect(run()).toBe(true);
  });

  it('redirige a login conservando returnUrl', () => {
    const result = run('/perfil') as UrlTree & {
      commands: unknown[];
      queryParams: Record<string, unknown>;
    };
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/perfil' },
    });
    expect(result.commands).toEqual(['/login']);
    expect(result.queryParams).toEqual({ returnUrl: '/perfil' });
  });
});

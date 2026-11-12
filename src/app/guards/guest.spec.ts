import { TestBed } from '@angular/core/testing';
import { Router, type UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { guestGuard } from './guest';
import { AuthService } from '../services/auth';
import { createRouterMock } from '../../testing/router-mocks';

describe('guestGuard', () => {
  const router = createRouterMock();
  let isAuthenticated = signal(false);
  let isAdmin = signal(false);

  beforeEach(() => {
    isAuthenticated = signal(false);
    isAdmin = signal(false);
    router.createUrlTree.mockClear();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        {
          provide: AuthService,
          useValue: { isAuthenticated, isAdmin },
        },
      ],
    });
  });

  function run() {
    return TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));
  }

  it('permite acceso sin sesión', () => {
    expect(run()).toBe(true);
  });

  it('cliente autenticado → cartelera', () => {
    isAuthenticated.set(true);
    isAdmin.set(false);
    const result = run() as UrlTree & { commands: unknown[] };
    expect(router.createUrlTree).toHaveBeenCalledWith(['/cartelera']);
    expect(result.commands).toEqual(['/cartelera']);
  });

  it('admin autenticado → admin', () => {
    isAuthenticated.set(true);
    isAdmin.set(true);
    const result = run() as UrlTree & { commands: unknown[] };
    expect(router.createUrlTree).toHaveBeenCalledWith(['/admin']);
    expect(result.commands).toEqual(['/admin']);
  });
});

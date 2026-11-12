import { TestBed } from '@angular/core/testing';
import { Router, type UrlTree } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { resetTokenGuard } from './reset-token';
import { createRouterMock, createToastrMock } from '../../testing/router-mocks';

describe('resetTokenGuard', () => {
  const router = createRouterMock();
  const toastr = createToastrMock();

  beforeEach(() => {
    router.createUrlTree.mockClear();
    toastr.warning.mockClear();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: ToastrService, useValue: toastr },
      ],
    });
  });

  function run(token: string | null) {
    const route = {
      queryParamMap: {
        get: (key: string) => (key === 'token' ? token : null),
      },
    } as never;

    return TestBed.runInInjectionContext(() => resetTokenGuard(route, {} as never));
  }

  it('permite acceso con token', () => {
    expect(run('abc-123')).toBe(true);
    expect(toastr.warning).not.toHaveBeenCalled();
  });

  it('token vacío → olvidar-password', () => {
    const result = run('   ') as UrlTree & { commands: unknown[] };
    expect(toastr.warning).toHaveBeenCalledWith(
      'El enlace de recuperación no es válido.',
      'Contraseña',
    );
    expect(router.createUrlTree).toHaveBeenCalledWith(['/olvidar-password']);
    expect(result.commands).toEqual(['/olvidar-password']);
  });

  it('sin token → olvidar-password', () => {
    const result = run(null) as UrlTree & { commands: unknown[] };
    expect(result.commands).toEqual(['/olvidar-password']);
  });
});

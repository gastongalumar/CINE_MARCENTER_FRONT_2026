import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { funcionAccessGuard } from './funcion-access';
import { autorizarFuncion } from '../utils/butacas-access';

describe('funcionAccessGuard', () => {
  const routerMock = {
    createUrlTree: (commands: unknown[]) => ({ commands }) as unknown as UrlTree,
  };
  const toastrMock = { warning: vi.fn() };

  beforeEach(() => {
    sessionStorage.clear();
    toastrMock.warning.mockClear();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: ToastrService, useValue: toastrMock },
      ],
    });
  });

  function runGuard(peliculaId: string, funcionId: string) {
    const route = {
      paramMap: {
        get: (key: string) => {
          if (key === 'peliculaId') return peliculaId;
          if (key === 'funcionId') return funcionId;
          return null;
        },
      },
      parent: null,
    } as never;

    return TestBed.runInInjectionContext(() => funcionAccessGuard(route, {} as never));
  }

  it('permite acceso si la función está autorizada', () => {
    autorizarFuncion(5);
    expect(runGuard('12', '5')).toBe(true);
  });

  it('bloquea ID manipulado y redirige a horarios de la película', () => {
    autorizarFuncion(5);
    const result = runGuard('12', '99') as UrlTree & { commands: unknown[] };
    expect(result).toEqual(expect.objectContaining({ commands: ['/butacas', 12] }));
    expect(toastrMock.warning).toHaveBeenCalled();
  });

  it('sin autorización redirige a horarios', () => {
    const result = runGuard('12', '5') as UrlTree & { commands: unknown[] };
    expect(result).toEqual(expect.objectContaining({ commands: ['/butacas', 12] }));
  });
});

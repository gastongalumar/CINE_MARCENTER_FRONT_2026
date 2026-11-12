import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { butacasAccessGuard } from './butacas-access';
import { autorizarButacas } from '../utils/butacas-access';

describe('butacasAccessGuard', () => {
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

  function runGuard(peliculaId: string) {
    const route = {
      paramMap: {
        get: (key: string) => (key === 'peliculaId' ? peliculaId : null),
      },
      parent: null,
    } as never;

    return TestBed.runInInjectionContext(() => butacasAccessGuard(route, {} as never));
  }

  it('permite acceso si la película está autorizada', () => {
    autorizarButacas(12);
    expect(runGuard('12')).toBe(true);
  });

  it('bloquea y redirige a cartelera si no está autorizada', () => {
    const result = runGuard('12') as UrlTree & { commands: unknown[] };
    expect(result).toEqual(expect.objectContaining({ commands: ['/cartelera'] }));
    expect(toastrMock.warning).toHaveBeenCalled();
  });

  it('id no numérico (NaN) bloquea y redirige a cartelera', () => {
    autorizarButacas(12);
    const result = runGuard('abc') as UrlTree & { commands: unknown[] };
    expect(result).toEqual(expect.objectContaining({ commands: ['/cartelera'] }));
    expect(toastrMock.warning).toHaveBeenCalled();
  });

  it('id 0 o negativo bloquea aunque haya ticket guardado', () => {
    autorizarButacas(12);
    expect(runGuard('0')).toEqual(expect.objectContaining({ commands: ['/cartelera'] }));
    expect(runGuard('-3')).toEqual(expect.objectContaining({ commands: ['/cartelera'] }));
  });
});

import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { signal } from '@angular/core';
import { compraPagoGuard } from './compra-pago';
import { AuthService } from '../services/auth';
import { CompraFlujoService } from '../services/compra-flujo.service';

describe('compraPagoGuard', () => {
  const routerMock = {
    createUrlTree: (commands: unknown[]) => ({ commands }) as unknown as UrlTree,
  };
  const toastrMock = { warning: vi.fn(), info: vi.fn() };

  let compra: CompraFlujoService;
  let isAdminSignal = signal(false);

  beforeEach(() => {
    sessionStorage.clear();
    toastrMock.warning.mockClear();
    toastrMock.info.mockClear();
    isAdminSignal = signal(false);
    compra = new CompraFlujoService();

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: ToastrService, useValue: toastrMock },
        { provide: CompraFlujoService, useValue: compra },
        {
          provide: AuthService,
          useValue: { isAdmin: isAdminSignal },
        },
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
    } as never;

    return TestBed.runInInjectionContext(() => compraPagoGuard(route, {} as never));
  }

  it('redirige admin a asientos', () => {
    isAdminSignal.set(true);
    compra.setContexto(12, 5);
    compra.setSeleccion(['A1']);
    const result = runGuard('12', '5') as UrlTree & { commands: unknown[] };
    expect(result).toEqual(
      expect.objectContaining({ commands: ['/butacas', 12, 'funcion', 5] })
    );
    expect(toastrMock.warning).toHaveBeenCalled();
  });

  it('sin selección redirige a asientos', () => {
    compra.setContexto(12, 5);
    const result = runGuard('12', '5') as UrlTree & { commands: unknown[] };
    expect(result).toEqual(
      expect.objectContaining({ commands: ['/butacas', 12, 'funcion', 5] })
    );
    expect(toastrMock.info).toHaveBeenCalled();
  });

  it('con selección de cliente permite el paso', () => {
    compra.setContexto(12, 5);
    compra.setSeleccion(['A1', 'A2']);
    expect(runGuard('12', '5')).toBe(true);
  });

  it('funcionId inválido redirige a horarios de la película', () => {
    compra.setContexto(12, 5);
    compra.setSeleccion(['A1']);
    const result = runGuard('12', 'abc') as UrlTree & { commands: unknown[] };
    expect(result).toEqual(
      expect.objectContaining({ commands: ['/butacas', 12] })
    );
    expect(toastrMock.info).toHaveBeenCalled();
  });

  it('peliculaId inválido redirige a cartelera', () => {
    compra.setContexto(12, 5);
    compra.setSeleccion(['A1']);
    const result = runGuard('xyz', '5') as UrlTree & { commands: unknown[] };
    expect(result).toEqual(expect.objectContaining({ commands: ['/cartelera'] }));
    expect(toastrMock.warning).toHaveBeenCalled();
  });

  it('ambos ids inválidos redirige a cartelera', () => {
    const result = runGuard('nope', 'nope') as UrlTree & { commands: unknown[] };
    expect(result).toEqual(expect.objectContaining({ commands: ['/cartelera'] }));
    expect(toastrMock.warning).toHaveBeenCalled();
  });

  it('peliculaId de URL distinto al contexto redirige a asientos', () => {
    compra.setContexto(12, 5);
    compra.setSeleccion(['A1']);
    const result = runGuard('99', '5') as UrlTree & { commands: unknown[] };
    expect(result).toEqual(
      expect.objectContaining({ commands: ['/butacas', 99, 'funcion', 5] })
    );
    expect(toastrMock.info).toHaveBeenCalled();
  });
});

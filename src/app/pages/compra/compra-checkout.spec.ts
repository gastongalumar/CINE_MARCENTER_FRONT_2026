import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { of, throwError } from 'rxjs';
import { CompraCheckoutComponent } from './compra-checkout';
import { FuncionService } from '../../services/funcion';
import { ReservaService } from '../../services/reserva';
import { HoldService } from '../../services/hold.service';
import { AuthService } from '../../services/auth';
import { PaymentService } from '../../services/payment';
import { CandyComboService } from '../../services/candy-combo';
import { CodigoDescuentoService } from '../../services/codigo-descuento';
import { CompraFlujoService } from '../../services/compra-flujo.service';
import { MetodoPago } from '../../models/metodo-pago';
import type { Funcion } from '../../models/funcion';
import { createRouterMock, createToastrMock } from '../../../testing/router-mocks';
import { createAuthServiceMock } from '../../../testing/auth-mocks';

describe('CompraCheckoutComponent', () => {
  let component: CompraCheckoutComponent;
  let compraFlujo: CompraFlujoService;
  let router: ReturnType<typeof createRouterMock>;
  let crearReserva: ReturnType<typeof vi.fn>;
  let crearPreferencia: ReturnType<typeof vi.fn>;
  let liberarTodos: ReturnType<typeof vi.fn>;
  let auth: ReturnType<typeof createAuthServiceMock>;
  let toastr: ReturnType<typeof createToastrMock>;

  const funcion: Funcion = {
    id: 5,
    salaId: 1,
    peliculaId: 12,
    horario: '2026-06-15T20:00:00',
    precio: 1500,
  };

  beforeEach(() => {
    sessionStorage.clear();
    router = createRouterMock('/butacas/12/funcion/5/pago');
    compraFlujo = new CompraFlujoService();
    compraFlujo.setContexto(12, 5);
    compraFlujo.setSeleccion(['A1']);

    crearReserva = vi.fn(() =>
      of({
        id: 99,
        numeroTicket: 'TK-99',
        montoTotal: 1500,
        metodoPago: MetodoPago.MERCADO_PAGO,
        asientosSeleccionados: ['A1'],
      })
    );
    crearPreferencia = vi.fn(() => throwError(() => ({ status: 500 })));
    liberarTodos = vi.fn(() => of(null));
    toastr = createToastrMock();

    auth = createAuthServiceMock({
      authenticated: true,
      role: 'CLIENTE',
      user: {
        id: 7,
        email: 'cliente@test.com',
        nombre: 'Test',
        tipo: 'CLIENTE',
        token: 'x',
      },
    });

    TestBed.configureTestingModule({
      providers: [
        CompraCheckoutComponent,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ peliculaId: '12', funcionId: '5' }),
            },
          },
        },
        { provide: Router, useValue: router },
        {
          provide: FuncionService,
          useValue: { obtenerPorId: vi.fn(() => of(funcion)) },
        },
        { provide: ReservaService, useValue: { crearReserva } },
        { provide: HoldService, useValue: { liberarTodos } },
        { provide: PaymentService, useValue: { crearPreferencia } },
        {
          provide: CandyComboService,
          useValue: { listarActivos: vi.fn(() => of([])) },
        },
        {
          provide: CodigoDescuentoService,
          useValue: { validar: vi.fn(() => of({ valido: false })) },
        },
        { provide: AuthService, useValue: auth },
        { provide: CompraFlujoService, useValue: compraFlujo },
        { provide: ToastrService, useValue: toastr },
        { provide: ChangeDetectorRef, useValue: { markForCheck: vi.fn(), detectChanges: vi.fn() } },
      ],
    });

    component = TestBed.inject(CompraCheckoutComponent);
    component.peliculaId = 12;
    component.funcionId = 5;
    component.funcion = funcion;
    component.asientosSeleccionados = ['A1'];
    component.metodoPago = MetodoPago.MERCADO_PAGO;
  });

  it('si crearPreferencia falla, mantiene el flujo y permite reintentar', () => {
    const clearSpy = vi.spyOn(compraFlujo, 'clear');

    component.confirmarCompra();

    expect(crearReserva).toHaveBeenCalled();
    expect(clearSpy).not.toHaveBeenCalled();
    expect(compraFlujo.asientosSeleccionados).toEqual(['A1']);
    expect(compraFlujo.funcionId).toBe(5);
    expect(component.reservaPendientePagoId).toBe(99);
    expect(crearPreferencia).toHaveBeenCalledWith(99);
    expect(toastr.warning).toHaveBeenCalled();

    crearPreferencia.mockClear();
    crearPreferencia.mockReturnValueOnce(
      of({ init_point: 'https://mp.test/pay', sandbox_init_point: null as string | null })
    );

    const assignSpy = vi.fn();
    vi.stubGlobal('location', { href: '', assign: assignSpy });
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { href: '' },
    });

    component.reintentarPreferencia();

    expect(crearPreferencia).toHaveBeenCalledWith(99);
    expect(clearSpy).toHaveBeenCalled();
    expect(component.reservaPendientePagoId).toBeNull();
    expect(window.location.href).toBe('https://mp.test/pay');
  });
});

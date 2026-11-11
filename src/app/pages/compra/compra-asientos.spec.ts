import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { CompraAsientosComponent } from './compra-asientos';
import { FuncionService } from '../../services/funcion';
import { HoldService } from '../../services/hold.service';
import { AuthService } from '../../services/auth';
import {
  CompraFlujoService,
  MAX_ENTRADAS_COMPRA,
} from '../../services/compra-flujo.service';
import { createRouterMock, createToastrMock } from '../../../testing/router-mocks';
import { createAuthServiceMock } from '../../../testing/auth-mocks';

describe('CompraAsientosComponent', () => {
  let component: CompraAsientosComponent;
  let compraFlujo: CompraFlujoService;
  let router: ReturnType<typeof createRouterMock>;

  beforeEach(() => {
    router = createRouterMock();
    compraFlujo = new CompraFlujoService();
    const auth = createAuthServiceMock({
      authenticated: true,
      role: 'CLIENTE',
    });

    TestBed.configureTestingModule({
      providers: [
        CompraAsientosComponent,
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
          useValue: {
            obtenerPorId: vi.fn(() => of(null)),
            obtenerEstadoAsientos: vi.fn(() =>
              of({ ocupados: [], bloqueados: [], misBloqueados: [] })
            ),
          },
        },
        {
          provide: HoldService,
          useValue: {
            crear: vi.fn(() => of(null)),
            liberar: vi.fn(() => of(null)),
            liberarTodos: vi.fn(() => of(null)),
          },
        },
        { provide: AuthService, useValue: auth },
        { provide: CompraFlujoService, useValue: compraFlujo },
        { provide: ToastrService, useValue: createToastrMock() },
        { provide: ChangeDetectorRef, useValue: { markForCheck: vi.fn(), detectChanges: vi.fn() } },
      ],
    });

    component = TestBed.inject(CompraAsientosComponent);
  });

  it('expone maxEntradasCompra = 20 (MAX_ENTRADAS_COMPRA)', () => {
    expect(MAX_ENTRADAS_COMPRA).toBe(20);
    expect(component.maxEntradasCompra).toBe(20);
  });

  it('continuarAlPago marca navegación a pago y navega si hay selección', () => {
    const marcarSpy = vi.spyOn(compraFlujo, 'marcarNavegacionAPago');
    component.peliculaId = 12;
    component.funcionId = 5;
    component.asientosSeleccionados = ['A1', 'A2'];

    component.continuarAlPago();

    expect(compraFlujo.asientosSeleccionados).toEqual(['A1', 'A2']);
    expect(marcarSpy).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith([
      '/butacas',
      12,
      'funcion',
      5,
      'pago',
    ]);
  });

  it('continuarAlPago no hace nada sin selección', () => {
    const marcarSpy = vi.spyOn(compraFlujo, 'marcarNavegacionAPago');
    component.asientosSeleccionados = [];

    component.continuarAlPago();

    expect(marcarSpy).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});

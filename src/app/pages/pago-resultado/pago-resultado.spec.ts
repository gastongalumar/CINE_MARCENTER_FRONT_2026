import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { PagoResultadoComponent } from './pago-resultado';
import { ReservaService } from '../../services/reserva';
import { AuthService } from '../../services/auth';
import type { Reserva } from '../../models/reserva';

function reserva(partial: Partial<Reserva> & { id: number }): Reserva {
  return {
    numeroTicket: `TK-${partial.id}`,
    montoTotal: 1000,
    metodoPago: 'MERCADO_PAGO',
    asientosSeleccionados: ['A1'],
    pagada: false,
    ...partial,
  };
}

describe('PagoResultadoComponent', () => {
  let fixture: ComponentFixture<PagoResultadoComponent>;
  let listarMisReservas: ReturnType<typeof vi.fn>;
  let isAuthenticated: ReturnType<typeof signal<boolean>>;
  let queryParams: Record<string, string>;
  let routeData: Record<string, unknown>;

  function setup(options?: {
    authenticated?: boolean;
    estado?: string;
    params?: Record<string, string>;
    reservas?: Reserva[] | 'error';
  }) {
    listarMisReservas = vi.fn();
    if (options?.reservas === 'error') {
      listarMisReservas.mockReturnValue(throwError(() => new Error('fail')));
    } else {
      listarMisReservas.mockReturnValue(of(options?.reservas ?? []));
    }

    isAuthenticated = signal(options?.authenticated ?? true);
    queryParams = options?.params ?? {};
    routeData = { estado: options?.estado ?? 'exito' };

    TestBed.configureTestingModule({
      imports: [PagoResultadoComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: routeData,
              queryParamMap: convertToParamMap(queryParams),
            },
          },
        },
        {
          provide: ReservaService,
          useValue: { listarMisReservas },
        },
        {
          provide: AuthService,
          useValue: { isAuthenticated },
        },
      ],
    });

    fixture = TestBed.createComponent(PagoResultadoComponent);
    return fixture.componentInstance;
  }

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('encuentra la reserva por external_reference', () => {
    const component = setup({
      estado: 'exito',
      params: { external_reference: '42' },
      reservas: [reserva({ id: 7, pagada: false }), reserva({ id: 42, pagada: true })],
    });

    component.ngOnInit();

    expect(listarMisReservas).toHaveBeenCalledTimes(1);
    expect(component.reserva()?.id).toBe(42);
    expect(component.pagada()).toBe(true);
    expect(component.titulo()).toBe('¡Pago aprobado!');
    expect(component.mensaje()).toContain('acreditó correctamente');
  });

  it('si falta external_reference no usa reservas[0]', () => {
    const component = setup({
      estado: 'exito',
      params: {},
      reservas: [reserva({ id: 1, pagada: true }), reserva({ id: 99, pagada: false })],
    });

    component.ngOnInit();

    expect(listarMisReservas).not.toHaveBeenCalled();
    expect(component.reserva()).toBeNull();
    expect(component.detalleEstado()).toContain('No se identificó la reserva');
  });

  it('si autenticado es false no consulta reservas', () => {
    const component = setup({ authenticated: false, estado: 'exito' });
    component.ngOnInit();
    expect(listarMisReservas).not.toHaveBeenCalled();
    expect(component.reserva()).toBeNull();
  });

  it('titulo/mensaje: exito pagada vs no pagada', () => {
    vi.useFakeTimers();

    const pagada = setup({
      estado: 'exito',
      params: { external_reference: '1' },
      reservas: [reserva({ id: 1, pagada: true })],
    });
    pagada.ngOnInit();
    expect(pagada.titulo()).toBe('¡Pago aprobado!');
    expect(pagada.mensaje()).toContain('reserva ya figura como pagada');

    TestBed.resetTestingModule();

    const enProceso = setup({
      estado: 'exito',
      params: { external_reference: '2' },
      reservas: [reserva({ id: 2, pagada: false })],
    });
    enProceso.ngOnInit();
    expect(enProceso.titulo()).toBe('Pago en proceso');
    expect(enProceso.mensaje()).toContain('esperando la confirmación');
    // Cancel retry timers from unpaid reserva so they do not leak.
    vi.clearAllTimers();
  });

  it('reintenta consulta con setTimeout cuando aún no está pagada', () => {
    const scheduled: Array<{ fn: () => void; ms: number }> = [];
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(((fn: TimerHandler, ms?: number) => {
      if (typeof fn === 'function') {
        scheduled.push({ fn: fn as () => void, ms: ms ?? 0 });
      }
      return 0 as unknown as ReturnType<typeof setTimeout>;
    }) as typeof setTimeout);

    const component = setup({
      estado: 'exito',
      params: { external_reference: '5' },
    });

    listarMisReservas
      .mockReturnValueOnce(of([reserva({ id: 5, pagada: false })]))
      .mockReturnValueOnce(of([reserva({ id: 5, pagada: true })]));

    component.ngOnInit();
    expect(listarMisReservas).toHaveBeenCalledTimes(1);
    expect(component.pagada()).toBe(false);

    const retries = scheduled.filter((s) => s.ms === 3000);
    expect(retries).toHaveLength(1);

    retries[0].fn();
    expect(listarMisReservas).toHaveBeenCalledTimes(2);
    expect(component.pagada()).toBe(true);
    expect(component.titulo()).toBe('¡Pago aprobado!');
    // Pagada → no further 3s retry timer.
    expect(scheduled.filter((s) => s.ms === 3000)).toHaveLength(1);
  });
});

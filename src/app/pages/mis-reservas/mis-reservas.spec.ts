import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { MisReservasComponent } from './mis-reservas';
import { ReservaService } from '../../services/reserva';
import { AuthService } from '../../services/auth';
import { ConfirmDialogService } from '../../services/confirm-dialog';
import { EstadoReserva } from '../../models/estado-reserva';
import { createAuthServiceMock } from '../../../testing/auth-mocks';
import { createToastrMock } from '../../../testing/router-mocks';

describe('MisReservasComponent', () => {
  let component: MisReservasComponent;
  let fixture: ComponentFixture<MisReservasComponent>;
  let reservaService: {
    listarMisReservas: ReturnType<typeof vi.fn>;
    cancelarReserva: ReturnType<typeof vi.fn>;
  };
  let confirmDialog: { confirmDanger: ReturnType<typeof vi.fn> };
  let toastr: ReturnType<typeof createToastrMock>;

  beforeEach(async () => {
    reservaService = {
      listarMisReservas: vi.fn(() => of([])),
      cancelarReserva: vi.fn(() => of({ message: 'ok' })),
    };
    confirmDialog = { confirmDanger: vi.fn(() => of(true)) };
    toastr = createToastrMock();

    await TestBed.configureTestingModule({
      imports: [MisReservasComponent],
      providers: [
        provideRouter([]),
        { provide: ReservaService, useValue: reservaService },
        { provide: AuthService, useValue: createAuthServiceMock({ authenticated: true }) },
        { provide: ToastrService, useValue: toastr },
        { provide: ConfirmDialogService, useValue: confirmDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MisReservasComponent);
    component = fixture.componentInstance;
  });

  it('cancelarReserva confirma y llama cancelarReserva + toast', () => {
    const cargarSpy = vi.spyOn(component, 'cargarReservas').mockImplementation(() => undefined);
    component.cancelarReserva('TK42');

    expect(confirmDialog.confirmDanger).toHaveBeenCalledWith(
      'Cancelar reserva',
      expect.stringContaining('TK42'),
      'Sí, cancelar'
    );
    expect(reservaService.cancelarReserva).toHaveBeenCalledWith('TK42');
    expect(toastr.success).toHaveBeenCalled();
    expect(cargarSpy).toHaveBeenCalled();
    expect(component.cancelando).toBe(false);
  });

  it('cancelarReserva aborta si el diálogo se cancela', () => {
    confirmDialog.confirmDanger.mockReturnValue(of(false));
    component.cancelarReserva('TK1');
    expect(reservaService.cancelarReserva).not.toHaveBeenCalled();
  });

  it('puedeCancelar es false si la función ya pasó o el estado es terminal', () => {
    expect(
      component.puedeCancelar({
        numeroTicket: 'TK1',
        montoTotal: 100,
        metodoPago: 'EFECTIVO',
        asientosSeleccionados: ['A1'],
        estadoReserva: EstadoReserva.CONFIRMADA,
        horarioFuncion: '2020-01-01T20:00:00',
      })
    ).toBe(false);

    expect(
      component.puedeCancelar({
        numeroTicket: 'TK2',
        montoTotal: 100,
        metodoPago: 'EFECTIVO',
        asientosSeleccionados: ['A1'],
        estadoReserva: EstadoReserva.VALIDADA,
        horarioFuncion: '2099-01-01T20:00:00',
      })
    ).toBe(false);

    expect(
      component.puedeCancelar({
        numeroTicket: 'TK3',
        montoTotal: 100,
        metodoPago: 'EFECTIVO',
        asientosSeleccionados: ['A1'],
        estadoReserva: EstadoReserva.CONFIRMADA,
        horarioFuncion: '2099-06-15T20:00:00',
      })
    ).toBe(true);
  });
});

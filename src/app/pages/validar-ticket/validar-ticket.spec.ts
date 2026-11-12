import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { ValidarTicketComponent } from './validar-ticket';
import { ReservaService } from '../../services/reserva';
import { createToastrMock } from '../../../testing/router-mocks';

describe('ValidarTicketComponent', () => {
  let component: ValidarTicketComponent;
  let fixture: ComponentFixture<ValidarTicketComponent>;
  let reservaService: { validarTicket: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    reservaService = { validarTicket: vi.fn(() => of({ mensaje: 'ok', numeroTicket: 'TK1' })) };
    await TestBed.configureTestingModule({
      imports: [ValidarTicketComponent],
      providers: [
        provideRouter([]),
        { provide: ReservaService, useValue: reservaService },
        { provide: ToastrService, useValue: createToastrMock() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ValidarTicketComponent);
    component = fixture.componentInstance;
  });

  it('numeroTicket requerido + patrón TK\\d+', () => {
    const ctrl = component.form.controls.numeroTicket;
    expect(ctrl.hasError('required')).toBe(true);

    ctrl.setValue('ABC123');
    expect(ctrl.hasError('pattern')).toBe(true);

    ctrl.setValue('TK');
    expect(ctrl.hasError('pattern')).toBe(true);

    ctrl.setValue('TK123');
    expect(ctrl.valid).toBe(true);
  });

  it('validar no llama API si patrón inválido', () => {
    component.form.controls.numeroTicket.setValue('X1');
    component.validar();
    expect(reservaService.validarTicket).not.toHaveBeenCalled();
  });

  it('validar llama ReservaService con ticket y marcarUsado', () => {
    // GAP: Validators.pattern(/^TK\d+$/) es case-sensitive; 'tk99' queda inválido
    // aunque validar() hace toUpperCase() solo después de pasar el form.
    component.form.patchValue({ numeroTicket: 'tk99', marcarUsado: false });
    expect(component.form.controls.numeroTicket.hasError('pattern')).toBe(true);

    component.form.patchValue({ numeroTicket: 'TK99', marcarUsado: false });
    component.validar();
    expect(reservaService.validarTicket).toHaveBeenCalledWith('TK99', false);
  });

  it('estadoLabel / estadoBadgeClass', () => {
    expect(component.estadoLabel('VALIDADO_AHORA')).toBe('Validado ahora');
    expect(component.estadoBadgeClass('CANCELADA')).toBe('bg-danger');
    expect(component.estadoBadgeClass('DESCONOCIDO')).toBe('bg-secondary');
  });
});

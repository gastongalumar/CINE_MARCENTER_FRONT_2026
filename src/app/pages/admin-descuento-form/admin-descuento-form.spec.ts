import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { AdminDescuentoFormComponent } from './admin-descuento-form';
import { CodigoDescuentoService } from '../../services/codigo-descuento';
import { createToastrMock } from '../../../testing/router-mocks';

describe('AdminDescuentoFormComponent', () => {
  let component: AdminDescuentoFormComponent;
  let fixture: ComponentFixture<AdminDescuentoFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDescuentoFormComponent],
      providers: [
        provideRouter([]),
        {
          provide: CodigoDescuentoService,
          useValue: {
            obtener: vi.fn(() => of(null)),
            crear: vi.fn(() => of({})),
            actualizar: vi.fn(() => of({})),
          },
        },
        { provide: ToastrService, useValue: createToastrMock() },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDescuentoFormComponent);
    component = fixture.componentInstance;
  });

  it('codigo required + maxLength 40; valor min 0.01', () => {
    component.form.controls.codigo.setValue('');
    expect(component.form.controls.codigo.hasError('required')).toBe(true);

    component.form.controls.codigo.setValue('X'.repeat(41));
    expect(component.form.controls.codigo.hasError('maxlength')).toBe(true);

    component.form.controls.valor.setValue(0);
    expect(component.form.controls.valor.hasError('min')).toBe(true);

    component.form.patchValue({
      codigo: 'PROMO10',
      tipo: 'PORCENTAJE',
      valor: 10,
    });
    expect(component.form.valid).toBe(true);
  });

  it('PORCENTAJE rechaza valor > 100; MONTO_FIJO admite montos altos', () => {
    component.form.patchValue({
      codigo: 'OVERFLOW',
      tipo: 'PORCENTAJE',
      valor: 150,
      activo: true,
    });
    expect(component.form.controls.valor.hasError('max')).toBe(true);

    component.form.patchValue({ tipo: 'PORCENTAJE', valor: 100 });
    expect(component.form.controls.valor.errors).toBeNull();

    component.actualizarValidadoresValor('MONTO_FIJO');
    component.form.patchValue({ tipo: 'MONTO_FIJO', valor: 150 });
    expect(component.form.controls.valor.errors).toBeNull();
  });

  it('esInvalido es true solo si el control es inválido y touched/dirty', () => {
    component.form.controls.valor.setValue(150);
    expect(component.esInvalido('valor')).toBe(false);

    component.form.controls.valor.markAsTouched();
    expect(component.esInvalido('valor')).toBe(true);

    component.form.controls.valor.setValue(50);
    expect(component.esInvalido('valor')).toBe(false);
  });

  it('usosMaximos: null/vacío válido; 0 y negativos fallan min(1)', () => {
    component.form.controls.usosMaximos.setValue(null);
    expect(component.form.controls.usosMaximos.errors).toBeNull();

    component.form.controls.usosMaximos.setValue(0);
    expect(component.form.controls.usosMaximos.hasError('min')).toBe(true);

    component.form.controls.usosMaximos.setValue(-20);
    expect(component.form.controls.usosMaximos.hasError('min')).toBe(true);

    component.form.controls.usosMaximos.setValue(5);
    expect(component.form.controls.usosMaximos.errors).toBeNull();
  });
});


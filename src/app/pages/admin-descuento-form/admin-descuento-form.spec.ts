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

  // GAP documentado: PORCENTAJE no tiene Validators.max(100) en el form actual.
  it('GAP: PORCENTAJE permite valor 150 (sin Validators.max(100))', () => {
    component.form.patchValue({
      codigo: 'OVERFLOW',
      tipo: 'PORCENTAJE',
      valor: 150,
      activo: true,
    });
    expect(component.form.controls.valor.errors).toBeNull();
    expect(component.form.valid).toBe(true);
  });
});

import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { SalasComponent } from './salas';
import { SalaService } from '../../services/sala';
import { createRouterMock, createToastrMock } from '../../../testing/router-mocks';

describe('SalasComponent', () => {
  let component: SalasComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SalasComponent,
        {
          provide: SalaService,
          useValue: {
            crear: vi.fn(() => of({})),
            actualizar: vi.fn(() => of({})),
            obtenerPorId: vi.fn(() => of(null)),
          },
        },
        { provide: ToastrService, useValue: createToastrMock() },
        { provide: Router, useValue: createRouterMock() },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of(convertToParamMap({})),
          },
        },
      ],
    });
    component = TestBed.inject(SalasComponent);
  });

  it('filas 1-20 y columnas 1-16', () => {
    const { filas, columnas } = component.form.controls;

    filas.setValue(0);
    expect(filas.hasError('min')).toBe(true);
    filas.setValue(21);
    expect(filas.hasError('max')).toBe(true);
    filas.setValue(20);
    expect(filas.valid).toBe(true);

    columnas.setValue(0);
    expect(columnas.hasError('min')).toBe(true);
    columnas.setValue(17);
    expect(columnas.hasError('max')).toBe(true);
    columnas.setValue(16);
    expect(columnas.valid).toBe(true);
  });

  it('nombre required + maxLength 100', () => {
    const nombre = component.form.controls.nombre;
    expect(nombre.hasError('required')).toBe(true);
    nombre.setValue('S'.repeat(101));
    expect(nombre.hasError('maxlength')).toBe(true);
    nombre.setValue('Sala 1');
    expect(nombre.valid).toBe(true);
  });

  it('capacidad mínima 50 (filas*columnas)', () => {
    component.form.patchValue({ nombre: 'Sala X', filas: 2, columnas: 10 });
    expect(component.form.hasError('capacidadMinima')).toBe(true);

    component.form.patchValue({ filas: 5, columnas: 10 });
    expect(component.form.hasError('capacidadMinima')).toBe(false);
  });

  it('defaults válidos 10x16', () => {
    component.form.controls.nombre.setValue('Principal');
    expect(component.form.valid).toBe(true);
    expect(component.form.getRawValue()).toMatchObject({ filas: 10, columnas: 16 });
  });
});

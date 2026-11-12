import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { PerfilComponent } from './perfil';
import { AuthService } from '../../services/auth';
import { UsuarioService } from '../../services/usuario';
import { ImageService } from '../../services/image';
import { createAuthServiceMock } from '../../../testing/auth-mocks';
import { createToastrMock } from '../../../testing/router-mocks';

describe('PerfilComponent', () => {
  let component: PerfilComponent;
  let fixture: ComponentFixture<PerfilComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: createAuthServiceMock({ authenticated: false }) },
        {
          provide: UsuarioService,
          useValue: {
            obtenerMiPerfil: vi.fn(),
            actualizarMiPerfil: vi.fn(),
            subirFotoPerfil: vi.fn(),
            eliminarFotoPerfil: vi.fn(),
          },
        },
        { provide: ImageService, useValue: { getImageUrl: vi.fn(() => '') } },
        { provide: ToastrService, useValue: createToastrMock() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilComponent);
    component = fixture.componentInstance;
  });

  it('nombre y apellido required + maxLength 20', () => {
    const { nombre, apellido } = component.form.controls;
    expect(nombre.hasError('required')).toBe(true);
    expect(apellido.hasError('required')).toBe(true);

    nombre.setValue('A'.repeat(21));
    apellido.setValue('B'.repeat(21));
    expect(nombre.hasError('maxlength')).toBe(true);
    expect(apellido.hasError('maxlength')).toBe(true);

    nombre.setValue('Ana');
    apellido.setValue('Pérez');
    expect(nombre.valid).toBe(true);
    expect(apellido.valid).toBe(true);
  });

  it('acepta nombre de exactamente 20 chars', () => {
    component.form.controls.nombre.setValue('A'.repeat(20));
    expect(component.form.controls.nombre.valid).toBe(true);
  });
});

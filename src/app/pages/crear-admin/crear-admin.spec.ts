import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CrearAdminComponent } from './crear-admin';
import { AuthService } from '../../services/auth';
import { UsuarioService } from '../../services/usuario';
import { createAuthServiceMock } from '../../../testing/auth-mocks';

describe('CrearAdminComponent', () => {
  let component: CrearAdminComponent;
  let fixture: ComponentFixture<CrearAdminComponent>;
  let auth: ReturnType<typeof createAuthServiceMock> & {
    registrarAdmin: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    auth = {
      ...createAuthServiceMock({ authenticated: true, role: 'SUPERADMIN' }),
      registrarAdmin: vi.fn(() => of({})),
    };
    await TestBed.configureTestingModule({
      imports: [CrearAdminComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        {
          provide: UsuarioService,
          useValue: {
            listarPorRol: vi.fn(() => of([])),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CrearAdminComponent);
    component = fixture.componentInstance;
  });

  it('campos required + email + password min 6', () => {
    expect(component.form.invalid).toBe(true);
    component.form.patchValue({
      nombre: 'Admin',
      apellido: 'Uno',
      email: 'admin@test.com',
      tipo: 'ADMINISTRADOR',
      password: '12345',
      confirmPassword: '12345',
    });
    expect(component.form.controls.password.hasError('minlength')).toBe(true);

    component.form.patchValue({ password: '123456', confirmPassword: '123456' });
    expect(component.form.valid).toBe(true);
  });

  it('passwords deben coincidir', () => {
    component.form.patchValue({
      nombre: 'A',
      apellido: 'B',
      email: 'a@b.com',
      password: '123456',
      confirmPassword: 'xxxxxx',
    });
    expect(component.form.hasError('passwordsNoCoinciden')).toBe(true);
  });

  it('etiquetaRol', () => {
    expect(component.etiquetaRol('SUPERADMIN')).toBe('SuperAdmin');
    expect(component.etiquetaRol('ADMINISTRADOR')).toBe('Administrador');
    expect(component.etiquetaRol('CLIENTE')).toBe('CLIENTE');
  });
});

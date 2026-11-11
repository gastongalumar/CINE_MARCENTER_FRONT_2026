import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { LoginComponent } from './login';
import { AuthService } from '../../services/auth';
import { CustomizacionService } from '../../services/customizacion';
import { createAuthServiceMock } from '../../../testing/auth-mocks';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let auth: ReturnType<typeof createAuthServiceMock>;
  let customizacion: { obtenerTema: ReturnType<typeof vi.fn>; aplicarTema: ReturnType<typeof vi.fn> };
  let navigateByUrlSpy: ReturnType<typeof vi.spyOn>;

  async function setup(query: Record<string, string> = {}, authenticated = false) {
    auth = createAuthServiceMock({ authenticated });
    customizacion = {
      obtenerTema: vi.fn(() => of({ logoUrl: '' })),
      aplicarTema: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(query) } },
        },
        { provide: CustomizacionService, useValue: customizacion },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    navigateByUrlSpy = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    return component;
  }

  it('email required + email format; password required', async () => {
    await setup();
    const { email, password } = component.form.controls;
    expect(component.form.invalid).toBe(true);

    email.setValue('no-email');
    password.setValue('');
    expect(email.hasError('email')).toBe(true);
    expect(password.hasError('required')).toBe(true);

    email.setValue('user@test.com');
    password.setValue('secret');
    expect(component.form.valid).toBe(true);
  });

  it('si ya autenticado redirige a returnUrl', async () => {
    await setup({ returnUrl: '/perfil' }, true);
    component.ngOnInit();
    expect(navigateByUrlSpy).toHaveBeenCalledWith('/perfil');
    expect(customizacion.obtenerTema).not.toHaveBeenCalled();
  });

  it('sin sesión carga tema y no navega', async () => {
    await setup({}, false);
    component.ngOnInit();
    expect(navigateByUrlSpy).not.toHaveBeenCalled();
    expect(customizacion.obtenerTema).toHaveBeenCalled();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { OlvidarPasswordComponent } from './olvidar-password';
import { AuthService } from '../../services/auth';
import { createAuthServiceMock } from '../../../testing/auth-mocks';

describe('OlvidarPasswordComponent', () => {
  let component: OlvidarPasswordComponent;
  let fixture: ComponentFixture<OlvidarPasswordComponent>;
  let auth: ReturnType<typeof createAuthServiceMock> & {
    forgotPassword: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    auth = {
      ...createAuthServiceMock(),
      forgotPassword: vi.fn(() => of({ message: 'ok' })),
    };
    await TestBed.configureTestingModule({
      imports: [OlvidarPasswordComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    }).compileComponents();

    fixture = TestBed.createComponent(OlvidarPasswordComponent);
    component = fixture.componentInstance;
  });

  it('email required + formato', () => {
    expect(component.form.invalid).toBe(true);
    component.form.controls.email.setValue('malo');
    expect(component.form.controls.email.hasError('email')).toBe(true);
    component.form.controls.email.setValue('user@test.com');
    expect(component.form.valid).toBe(true);
  });

  it('onSubmit no llama API si inválido', () => {
    component.onSubmit();
    expect(auth.forgotPassword).not.toHaveBeenCalled();
    expect(component.form.controls.email.touched).toBe(true);
  });

  it('onSubmit OK marca enviado', () => {
    component.form.controls.email.setValue('user@test.com');
    component.onSubmit();
    expect(auth.forgotPassword).toHaveBeenCalledWith('user@test.com');
    expect(component.enviado).toBe(true);
    expect(component.loading).toBe(false);
  });

  it('onSubmit error setea mensaje', () => {
    auth.forgotPassword.mockReturnValue(throwError(() => ({ message: 'fail' })));
    component.form.controls.email.setValue('user@test.com');
    component.onSubmit();
    expect(component.error).toBe('fail');
    expect(component.enviado).toBe(false);
  });
});

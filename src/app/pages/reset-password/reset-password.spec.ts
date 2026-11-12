import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { ResetPasswordComponent } from './reset-password';
import { AuthService } from '../../services/auth';
import { createAuthServiceMock } from '../../../testing/auth-mocks';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let auth: ReturnType<typeof createAuthServiceMock> & {
    resetPassword: ReturnType<typeof vi.fn>;
  };
  let navigateSpy: ReturnType<typeof vi.spyOn>;

  async function setup(token: string | null) {
    auth = {
      ...createAuthServiceMock(),
      resetPassword: vi.fn(() => of({ message: 'ok' })),
    };
    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap(token == null ? {} : { token }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    return component;
  }

  it('passwordNueva minLength 6 + match confirm', async () => {
    await setup('tok');
    component.form.patchValue({ passwordNueva: '12345', confirmPassword: '12345' });
    expect(component.form.controls.passwordNueva.hasError('minlength')).toBe(true);

    component.form.patchValue({ passwordNueva: '123456', confirmPassword: 'abcdef' });
    expect(component.form.hasError('passwordsNoCoinciden')).toBe(true);

    component.form.controls.confirmPassword.setValue('123456');
    expect(component.form.valid).toBe(true);
  });

  it('passwordNueva y confirmPassword required', async () => {
    await setup('tok');
    component.form.controls.passwordNueva.setValue('');
    component.form.controls.confirmPassword.setValue('');
    expect(component.form.controls.passwordNueva.hasError('required')).toBe(true);
    expect(component.form.controls.confirmPassword.hasError('required')).toBe(true);

    component.form.controls.confirmPassword.markAsTouched();
    expect(component.esInvalido('confirmPassword')).toBe(true);
  });

  it('sin token onSubmit setea error y no llama API', async () => {
    await setup(null);
    component.form.patchValue({ passwordNueva: '123456', confirmPassword: '123456' });
    component.onSubmit();
    expect(component.error).toContain('token');
    expect(auth.resetPassword).not.toHaveBeenCalled();
  });

  it('con token válido navega a login?reset=true', async () => {
    await setup('abc-token');
    component.form.patchValue({ passwordNueva: '123456', confirmPassword: '123456' });
    component.onSubmit();
    expect(auth.resetPassword).toHaveBeenCalledWith('abc-token', '123456');
    expect(navigateSpy).toHaveBeenCalledWith(['/login'], { queryParams: { reset: 'true' } });
  });
});

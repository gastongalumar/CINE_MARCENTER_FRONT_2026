import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RegistroComponent } from './registro';
import { AuthService } from '../../services/auth';
import { createAuthServiceMock } from '../../../testing/auth-mocks';

describe('RegistroComponent', () => {
  let component: RegistroComponent;
  let fixture: ComponentFixture<RegistroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: createAuthServiceMock() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistroComponent);
    component = fixture.componentInstance;
  });

  it('password minLength 6', () => {
    component.form.patchValue({
      nombre: 'A',
      apellido: 'B',
      email: 'a@b.com',
      password: '12345',
      confirmPassword: '12345',
    });
    expect(component.form.controls.password.hasError('minlength')).toBe(true);

    component.form.controls.password.setValue('123456');
    component.form.controls.confirmPassword.setValue('123456');
    expect(component.form.controls.password.hasError('minlength')).toBe(false);
  });

  it('passwordsNoCoinciden cuando no matchean', () => {
    component.form.patchValue({
      nombre: 'A',
      apellido: 'B',
      email: 'a@b.com',
      password: '123456',
      confirmPassword: '654321',
    });
    expect(component.form.hasError('passwordsNoCoinciden')).toBe(true);

    component.form.controls.confirmPassword.setValue('123456');
    expect(component.form.hasError('passwordsNoCoinciden')).toBe(false);
  });

  it('passwordsNoCoinciden() exige touched/dirty de confirm', () => {
    component.form.patchValue({
      nombre: 'A',
      apellido: 'B',
      email: 'a@b.com',
      password: '123456',
      confirmPassword: 'x',
    });
    expect(component.passwordsNoCoinciden()).toBe(false);
    component.form.controls.confirmPassword.markAsTouched();
    expect(component.passwordsNoCoinciden()).toBe(true);
  });
});

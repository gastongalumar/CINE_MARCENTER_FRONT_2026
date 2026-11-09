import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { getErrorMessage } from '../../utils/api-error';
import { refreshView } from '../../utils/refresh-view';

function passwordsIguales(group: AbstractControl): ValidationErrors | null {
  const password = group.get('passwordNueva')?.value;
  const confirm = group.get('confirmPassword')?.value;
  if (!password || !confirm) return null;
  return password === confirm ? null : { passwordsNoCoinciden: true };
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reset-password.html',
  styleUrls: ['../login/login.css'],
})
export class ResetPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly token = (this.route.snapshot.queryParamMap.get('token') || '').trim();

  readonly form = this.fb.nonNullable.group(
    {
      passwordNueva: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsIguales }
  );

  loading = false;
  error = '';
  mostrarPassword = false;
  mostrarConfirmPassword = false;

  esInvalido(campo: string): boolean {
    const control = this.form.get(campo);
    return !!control && control.invalid && control.touched;
  }

  passwordsNoCoinciden(): boolean {
    return this.form.hasError('passwordsNoCoinciden') && !!this.form.get('confirmPassword')?.touched;
  }

  alternarPassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  alternarConfirmPassword(): void {
    this.mostrarConfirmPassword = !this.mostrarConfirmPassword;
  }

  onSubmit(): void {
    if (!this.token) {
      this.error = 'Falta el token de recuperación. Pedí un enlace nuevo desde “Olvidé mi contraseña”.';
      return;
    }
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';
    refreshView(this.cdr);

    this.authService.resetPassword(this.token, this.form.controls.passwordNueva.value).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/login'], { queryParams: { reset: 'true' } });
      },
      error: (err) => {
        this.loading = false;
        this.error = getErrorMessage(err, 'No se pudo restablecer la contraseña.');
        refreshView(this.cdr);
      },
    });
  }
}

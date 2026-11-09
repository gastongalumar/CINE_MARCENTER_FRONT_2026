import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { getErrorMessage } from '../../utils/api-error';
import { refreshView } from '../../utils/refresh-view';

@Component({
  selector: 'app-olvidar-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './olvidar-password.html',
  styleUrls: ['../login/login.css'],
})
export class OlvidarPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  loading = false;
  enviado = false;
  mensaje = '';
  error = '';

  esInvalido(campo: string): boolean {
    const control = this.form.get(campo);
    return !!control && control.invalid && control.touched;
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';
    refreshView(this.cdr);

    this.authService.forgotPassword(this.form.controls.email.value.trim()).subscribe({
      next: (res) => {
        this.loading = false;
        this.enviado = true;
        this.mensaje =
          res.message ||
          'Si el correo está registrado, te enviamos el enlace. En esta demo mirá la consola del backend.';
        refreshView(this.cdr);
      },
      error: (err) => {
        this.loading = false;
        this.error = getErrorMessage(err, 'No se pudo solicitar la recuperación.');
        refreshView(this.cdr);
      },
    });
  }
}

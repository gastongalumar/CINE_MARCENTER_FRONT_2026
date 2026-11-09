import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { RegistroRequest } from '../../models/auth';
import { getErrorMessage } from '../../utils/api-error';
import { esControlInvalido } from '../../utils/form-error';

function passwordsIguales(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  if (!password || !confirm) return null;
  return password === confirm ? null : { passwordsNoCoinciden: true };
}

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './registro.html',
  styleUrls: ['./registro.css'],
})
export class RegistroComponent {
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group(
    {
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsIguales }
  );

  loading = false;
  errorMessage = '';
  mostrarPassword = false;
  mostrarConfirmPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  esInvalido(campo: string): boolean {
    return esControlInvalido(this.form.get(campo));
  }

  passwordsNoCoinciden(): boolean {
    return (
      this.form.hasError('passwordsNoCoinciden') &&
      (!!this.form.get('confirmPassword')?.touched || !!this.form.get('confirmPassword')?.dirty)
    );
  }

  alternarPassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  alternarConfirmPassword(): void {
    this.mostrarConfirmPassword = !this.mostrarConfirmPassword;
  }

  onSubmit(): void {
    this.errorMessage = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const { confirmPassword: _, ...userData } = this.form.getRawValue();
    const payload: RegistroRequest = {
      ...userData,
      telefono: userData.telefono?.trim() || undefined,
    };

    this.authService.registro(payload).subscribe({
      next: () => {
        this.loading = false;
        setTimeout(() => this.cdr.detectChanges());
        this.router.navigate(['/login'], {
          queryParams: { registered: 'true' }
        });
      },
      error: (error: unknown) => {
        this.loading = false;
        this.errorMessage = getErrorMessage(error, 'No se pudo completar el registro.');
        setTimeout(() => this.cdr.detectChanges());
      }
    });
  }
}

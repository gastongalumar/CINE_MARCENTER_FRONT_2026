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
import {
  CODIGO_AREA_PATTERN,
  NUMERO_LOCAL_PATTERN,
  armarTelefonoLocal,
  telefonoLocalCompleto,
} from '../../utils/telefono';

function passwordsIguales(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  if (!password || !confirm) return null;
  return password === confirm ? null : { passwordsNoCoinciden: true };
}

function registroExtras(group: AbstractControl): ValidationErrors | null {
  return passwordsIguales(group) ?? telefonoLocalCompleto(group);
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
      codigoArea: ['', Validators.pattern(CODIGO_AREA_PATTERN)],
      numeroLocal: ['', Validators.pattern(NUMERO_LOCAL_PATTERN)],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: registroExtras }
  );

  loading = false;
  mostrarPassword = false;
  mostrarConfirmPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

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
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    const { confirmPassword: _, codigoArea, numeroLocal, ...userData } = this.form.getRawValue();
    const payload: RegistroRequest = {
      ...userData,
      telefono: armarTelefonoLocal(codigoArea, numeroLocal),
    };

    this.authService.registro(payload).subscribe({
      next: () => {
        this.loading = false;
        setTimeout(() => this.cdr.detectChanges());
        this.router.navigate(['/login'], {
          queryParams: { registered: 'true' }
        });
      },
      error: () => {
        this.loading = false;
        setTimeout(() => this.cdr.detectChanges());
      }
    });
  }
}

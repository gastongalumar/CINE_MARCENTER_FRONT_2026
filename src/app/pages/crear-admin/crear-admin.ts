import { Component, ChangeDetectionStrategy, ChangeDetectorRef, afterNextRender, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../services/auth';
import { UsuarioService } from '../../services/usuario';
import { RegistroRequest, TipoUsuario } from '../../models/auth';
import { Usuario } from '../../models/usuario';
import { getErrorMessage } from '../../utils/api-error';
import { refreshView } from '../../utils/refresh-view';

function passwordsIguales(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  if (!password || !confirm) return null;
  return password === confirm ? null : { passwordsNoCoinciden: true };
}

@Component({
  selector: 'app-crear-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './crear-admin.html',
  styleUrls: ['./crear-admin.css'],
})
export class CrearAdminComponent {
  private readonly fb = inject(FormBuilder);
  private readonly initLoad = afterNextRender(() => this.cargarAdministradores());

  readonly form = this.fb.nonNullable.group(
    {
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      tipo: ['ADMINISTRADOR' as TipoUsuario, Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsIguales }
  );

  loading = false;
  cargandoLista = true;
  errorMessage = '';
  successMessage = '';
  errorCarga = '';
  administradores: Usuario[] = [];
  pagina = 1;
  readonly pageSize = 6;
  mostrarPassword = false;
  mostrarConfirmPassword = false;

  constructor(
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef
  ) {}

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.administradores.length / this.pageSize));
  }

  get administradoresPagina(): Usuario[] {
    const start = (this.pagina - 1) * this.pageSize;
    return this.administradores.slice(start, start + this.pageSize);
  }

  get rangoDesde(): number {
    if (!this.administradores.length) return 0;
    return (this.pagina - 1) * this.pageSize + 1;
  }

  get rangoHasta(): number {
    return Math.min(this.pagina * this.pageSize, this.administradores.length);
  }

  esInvalido(campo: string): boolean {
    const control = this.form.get(campo);
    return !!control && control.invalid && control.touched;
  }

  passwordsNoCoinciden(): boolean {
    return this.form.hasError('passwordsNoCoinciden') && !!this.form.get('confirmPassword')?.touched;
  }

  onCampoBlur(): void {
    refreshView(this.cdr);
  }

  alternarPassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
    refreshView(this.cdr);
  }

  alternarConfirmPassword(): void {
    this.mostrarConfirmPassword = !this.mostrarConfirmPassword;
    refreshView(this.cdr);
  }

  etiquetaRol(tipo: string): string {
    if (tipo === 'SUPERADMIN') return 'SuperAdmin';
    if (tipo === 'ADMINISTRADOR') return 'Administrador';
    return tipo;
  }

  cargarAdministradores(): void {
    this.cargandoLista = true;
    this.errorCarga = '';
    refreshView(this.cdr);

    forkJoin({
      admins: this.usuarioService.listarPorRol('ADMINISTRADOR').pipe(catchError(() => of([] as Usuario[]))),
      supers: this.usuarioService.listarPorRol('SUPERADMIN').pipe(catchError(() => of([] as Usuario[]))),
    }).subscribe({
      next: ({ admins, supers }) => {
        this.administradores = [...supers, ...admins].sort((a, b) =>
          `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`, 'es')
        );
        this.pagina = 1;
        this.cargandoLista = false;
        refreshView(this.cdr);
      },
      error: (error) => {
        this.errorCarga = getErrorMessage(error, 'No se pudo cargar el listado de administradores.');
        this.cargandoLista = false;
        refreshView(this.cdr);
      },
    });
  }

  irAPagina(page: number): void {
    if (page < 1 || page > this.totalPaginas) return;
    this.pagina = page;
    refreshView(this.cdr);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    refreshView(this.cdr);

    const { confirmPassword: _, ...valores } = this.form.getRawValue();
    const tipo = valores.tipo === 'SUPERADMIN' ? 'SUPERADMIN' : 'ADMINISTRADOR';
    const adminData: RegistroRequest = {
      ...valores,
      tipo,
      telefono: valores.telefono?.trim() || undefined,
    };

    this.authService.registrarAdmin(adminData).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = `${this.etiquetaRol(tipo)} ${adminData.nombre} ${adminData.apellido} creado exitosamente.`;
        this.form.reset({
          nombre: '',
          apellido: '',
          email: '',
          telefono: '',
          tipo: 'ADMINISTRADOR',
          password: '',
          confirmPassword: '',
        });
        this.mostrarPassword = false;
        this.mostrarConfirmPassword = false;
        this.cargarAdministradores();
        refreshView(this.cdr);
      },
      error: (error) => {
        this.loading = false;
        const status = error?.status;
        if (status === 409) {
          this.errorMessage = 'Ya existe un usuario con este email';
        } else if (status === 403) {
          this.errorMessage = 'Solo un SuperAdmin puede crear administradores';
        } else {
          this.errorMessage = getErrorMessage(error, 'Error al crear el administrador');
        }
        refreshView(this.cdr);
      },
    });
  }
}

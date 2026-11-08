import { Component, ChangeDetectionStrategy, ChangeDetectorRef, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { UsuarioService } from '../../services/usuario';
import { RegistroRequest } from '../../models/auth';
import { Usuario } from '../../models/usuario';
import { getErrorMessage } from '../../utils/api-error';
import { refreshView } from '../../utils/refresh-view';

@Component({
  selector: 'app-crear-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './crear-admin.html',
  styleUrls: ['./crear-admin.css'],
})
export class CrearAdminComponent {

  private readonly initLoad = afterNextRender(() => this.cargarAdministradores());
  adminData: RegistroRequest = {
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    telefono: ''
  };
  confirmPassword = '';
  loading = false;
  cargandoLista = true;
  errorMessage = '';
  successMessage = '';
  errorCarga = '';
  administradores: Usuario[] = [];
  pagina = 1;
  readonly pageSize = 6;

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

  cargarAdministradores(): void {
    this.cargandoLista = true;
    this.errorCarga = '';
    refreshView(this.cdr);

    this.usuarioService.listarPorRol('ADMINISTRADOR').subscribe({
      next: (data) => {
        this.administradores = data;
        this.pagina = 1;
        this.cargandoLista = false;
        refreshView(this.cdr);
      },
      error: (error) => {
        this.errorCarga = getErrorMessage(error, 'No se pudo cargar el listado de administradores.');
        this.cargandoLista = false;
        refreshView(this.cdr);
      }
    });
  }

  irAPagina(page: number): void {
    if (page < 1 || page > this.totalPaginas) return;
    this.pagina = page;
    refreshView(this.cdr);
  }

  onSubmit(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    refreshView(this.cdr);

    this.authService.registrarAdmin(this.adminData).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = `Administrador ${this.adminData.nombre} ${this.adminData.apellido} creado exitosamente.`;
        this.adminData = {
          nombre: '',
          apellido: '',
          email: '',
          password: '',
          telefono: ''
        };
        this.confirmPassword = '';
        this.cargarAdministradores();
        refreshView(this.cdr);
      },
      error: (error) => {
        this.loading = false;
        const status = error?.status;
        if (status === 409) {
          this.errorMessage = 'Ya existe un usuario con este email';
        } else if (status === 403) {
          this.errorMessage = 'No tienes permiso para crear administradores';
        } else {
          this.errorMessage = getErrorMessage(error, 'Error al crear el administrador');
        }
        refreshView(this.cdr);
      }
    });
  }
}

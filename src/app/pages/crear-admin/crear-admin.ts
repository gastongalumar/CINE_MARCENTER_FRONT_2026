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

  constructor(
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef
  ) {}

  cargarAdministradores(): void {
    this.cargandoLista = true;
    this.errorCarga = '';
    refreshView(this.cdr);

    this.usuarioService.listarPorRol('ADMINISTRADOR').subscribe({
      next: (data) => {
        this.administradores = data;
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

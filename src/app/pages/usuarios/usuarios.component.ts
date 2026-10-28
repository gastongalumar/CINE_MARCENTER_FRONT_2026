import { Component, ChangeDetectionStrategy, ChangeDetectorRef, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UsuarioService } from '../../services/usuario.service';
import { Usuario } from '../../models/usuario.model';
import { getErrorMessage } from '../../utils/api-error.util';
import { refreshView } from '../../utils/refresh-view.util';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css'],
})
export class UsuariosComponent {

  private readonly initLoad = afterNextRender(() => this.cargarUsuarios());

  usuarios: Usuario[] = [];
  busqueda = '';
  cargando = true;
  errorCarga = '';

  constructor(
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef
  ) {}

  cargarUsuarios(): void {
    this.cargando = true;
    this.errorCarga = '';
    refreshView(this.cdr);

    this.usuarioService.listar().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.cargando = false;
        refreshView(this.cdr);
      },
      error: (error) => {
        this.errorCarga = getErrorMessage(error, 'No se pudo cargar el listado de usuarios.');
        this.cargando = false;
        refreshView(this.cdr);
      }
    });
  }

  aplicarBusqueda(): void {
    const texto = this.busqueda.trim();
    if (!texto) {
      this.cargarUsuarios();
      return;
    }

    this.cargando = true;
    this.errorCarga = '';
    refreshView(this.cdr);

    this.usuarioService.buscar(texto).subscribe({
      next: (data) => {
        this.usuarios = data;
        this.cargando = false;
        refreshView(this.cdr);
      },
      error: (error) => {
        this.errorCarga = getErrorMessage(error, 'No se pudo buscar usuarios.');
        this.cargando = false;
        refreshView(this.cdr);
      }
    });
  }

  limpiarBusqueda(): void {
    this.busqueda = '';
    this.cargarUsuarios();
  }

  esUsuarioActual(usuario: Usuario): boolean {
    return usuario.id === this.authService.getUserId();
  }
}

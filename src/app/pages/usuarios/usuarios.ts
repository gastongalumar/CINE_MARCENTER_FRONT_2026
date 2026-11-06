import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  afterNextRender,
  computed,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth';
import { UsuarioService } from '../../services/usuario';
import { ConfirmDialogService } from '../../services/confirm-dialog';
import { Usuario } from '../../models/usuario';
import { getErrorMessage } from '../../utils/api-error';
import { refreshView } from '../../utils/refresh-view';

/** Email del admin sembrado: no se puede borrar ni dar de baja. */
const EMAIL_ADMIN_PROTEGIDO = 'admin@mail.com';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './usuarios.html',
  styleUrls: ['./usuarios.css'],
})
export class UsuariosComponent {
  private readonly authService = inject(AuthService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toastr = inject(ToastrService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly initLoad = afterNextRender(() => this.cargarUsuarios());

  readonly usuarios = signal<Usuario[]>([]);
  readonly busqueda = signal('');
  readonly cargando = signal(true);
  readonly errorCarga = signal('');
  readonly pagina = signal(1);
  readonly pageSize = 8;

  readonly totalPaginas = computed(() => {
    const total = this.usuarios().length;
    return Math.max(1, Math.ceil(total / this.pageSize));
  });

  readonly usuariosPagina = computed(() => {
    const page = this.pagina();
    const start = (page - 1) * this.pageSize;
    return this.usuarios().slice(start, start + this.pageSize);
  });

  readonly rangoDesde = computed(() => {
    if (!this.usuarios().length) return 0;
    return (this.pagina() - 1) * this.pageSize + 1;
  });

  readonly rangoHasta = computed(() =>
    Math.min(this.pagina() * this.pageSize, this.usuarios().length)
  );

  cargarUsuarios(): void {
    this.cargando.set(true);
    this.errorCarga.set('');
    refreshView(this.cdr);

    this.usuarioService.listar().subscribe({
      next: (data) => {
        this.usuarios.set(data);
        this.pagina.set(1);
        this.cargando.set(false);
        refreshView(this.cdr);
      },
      error: (error) => {
        this.errorCarga.set(getErrorMessage(error, 'No se pudo cargar el listado de usuarios.'));
        this.cargando.set(false);
        refreshView(this.cdr);
      },
    });
  }

  aplicarBusqueda(): void {
    const texto = this.busqueda().trim();
    if (!texto) {
      this.cargarUsuarios();
      return;
    }

    this.cargando.set(true);
    this.errorCarga.set('');
    refreshView(this.cdr);

    this.usuarioService.buscar(texto).subscribe({
      next: (data) => {
        this.usuarios.set(data);
        this.pagina.set(1);
        this.cargando.set(false);
        refreshView(this.cdr);
      },
      error: (error) => {
        this.errorCarga.set(getErrorMessage(error, 'No se pudo buscar usuarios.'));
        this.cargando.set(false);
        refreshView(this.cdr);
      },
    });
  }

  limpiarBusqueda(): void {
    this.busqueda.set('');
    this.cargarUsuarios();
  }

  irAPagina(page: number): void {
    const total = this.totalPaginas();
    if (page < 1 || page > total) return;
    this.pagina.set(page);
    refreshView(this.cdr);
  }

  esUsuarioActual(usuario: Usuario): boolean {
    return usuario.id === this.authService.getUserId();
  }

  esAdminProtegido(usuario: Usuario): boolean {
    return (usuario.email || '').toLowerCase() === EMAIL_ADMIN_PROTEGIDO;
  }

  puedeDarDeBaja(usuario: Usuario): boolean {
    return (
      !this.esAdminProtegido(usuario) &&
      !this.esUsuarioActual(usuario) &&
      usuario.estado === 'ACTIVO'
    );
  }

  puedeReactivar(usuario: Usuario): boolean {
    return !this.esAdminProtegido(usuario) && usuario.estado !== 'ACTIVO';
  }

  puedeEliminarAdmin(usuario: Usuario): boolean {
    return (
      usuario.tipo === 'ADMINISTRADOR' &&
      !this.esAdminProtegido(usuario) &&
      !this.esUsuarioActual(usuario)
    );
  }

  darDeBaja(usuario: Usuario): void {
    if (!usuario.id || !this.puedeDarDeBaja(usuario)) return;

    this.confirmDialog
      .confirm({
        title: 'Dar de baja',
        message: `¿Dar de baja a «${usuario.nombre} ${usuario.apellido}»? No podrá iniciar sesión hasta reactivarlo.`,
        confirmText: 'Dar de baja',
        danger: true,
        icon: 'person_off',
      })
      .subscribe((ok) => {
        if (!ok) return;
        this.usuarioService.darDeBaja(usuario.id!).subscribe({
          next: (actualizado) => {
            this.reemplazarEnLista(actualizado);
            this.toastr.success('Usuario dado de baja', 'Listo');
            refreshView(this.cdr);
          },
          error: (error) => {
            this.toastr.error(getErrorMessage(error, 'No se pudo dar de baja.'), 'Error');
          },
        });
      });
  }

  reactivar(usuario: Usuario): void {
    if (!usuario.id || !this.puedeReactivar(usuario)) return;

    this.usuarioService.reactivar(usuario.id).subscribe({
      next: (actualizado) => {
        this.reemplazarEnLista(actualizado);
        this.toastr.success('Usuario reactivado', 'Listo');
        refreshView(this.cdr);
      },
      error: (error) => {
        this.toastr.error(getErrorMessage(error, 'No se pudo reactivar.'), 'Error');
      },
    });
  }

  eliminarAdmin(usuario: Usuario): void {
    if (!usuario.id || !this.puedeEliminarAdmin(usuario)) return;

    this.confirmDialog
      .confirmDanger(
        'Eliminar administrador',
        `¿Eliminar definitivamente a «${usuario.nombre} ${usuario.apellido}»? Esta acción no se puede deshacer.`
      )
      .subscribe((ok) => {
        if (!ok) return;
        this.usuarioService.eliminar(usuario.id!).subscribe({
          next: () => {
            this.usuarios.set(this.usuarios().filter((u) => u.id !== usuario.id));
            if (this.pagina() > this.totalPaginas()) {
              this.pagina.set(this.totalPaginas());
            }
            this.toastr.success('Administrador eliminado', 'Listo');
            refreshView(this.cdr);
          },
          error: (error) => {
            this.toastr.error(getErrorMessage(error, 'No se pudo eliminar.'), 'Error');
          },
        });
      });
  }

  private reemplazarEnLista(actualizado: Usuario): void {
    this.usuarios.set(
      this.usuarios().map((u) => (u.id === actualizado.id ? actualizado : u))
    );
  }
}

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  computed,
  inject,
  signal,
  afterNextRender,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth.service';
import { UsuarioService } from '../../services/usuario.service';
import { ImageService } from '../../services/image.service';
import { AuthResponse } from '../../models/auth.model';
import { Usuario } from '../../models/usuario.model';
import { InicialesPipe } from '../../pipes/iniciales.pipe';
import { FechaApiPipe } from '../../pipes/fecha-api.pipe';
import { getErrorMessage } from '../../utils/api-error.util';
import { refreshView } from '../../utils/refresh-view.util';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, RouterModule, InicialesPipe, FechaApiPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css'],
})
export class PerfilComponent {
  private readonly authService = inject(AuthService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly imageService = inject(ImageService);
  private readonly toastr = inject(ToastrService);
  private readonly cd = inject(ChangeDetectorRef);

  constructor() {
    afterNextRender(() => this.cargarPerfil());
  }

  readonly perfil = signal<Usuario | null>(null);
  readonly cargandoFoto = signal(false);
  readonly errorFoto = signal('');

  /** Usuario de la sesión actual. */
  readonly user = computed<AuthResponse | null>(() => this.authService.currentUser());

  /** Momento en que se restauró/inició la sesión (informativo). */
  readonly loginAt = computed<string>(() => new Date().toISOString());

  readonly fotoUrl = computed(() => {
    const ruta = this.perfil()?.fotoPerfilUrl || this.user()?.fotoPerfilUrl;
    if (!ruta) return null;
    return this.imageService.getImageUrl(ruta, '');
  });

  readonly nombreVisible = computed(() => {
    const p = this.perfil();
    if (p?.nombre || p?.apellido) {
      return `${p.nombre ?? ''} ${p.apellido ?? ''}`.trim();
    }
    return this.user()?.nombre || 'Usuario';
  });

  cargarPerfil(): void {
    if (!this.authService.isAuthenticated()) return;

    this.usuarioService.obtenerMiPerfil().subscribe({
      next: (perfil) => {
        this.perfil.set(perfil);
        this.authService.updateFotoPerfil(perfil.fotoPerfilUrl);
        refreshView(this.cd);
      },
      error: () => {
        // Si falla /me, seguimos con los datos de la sesión.
        refreshView(this.cd);
      },
    });
  }

  onSeleccionarFoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.toastr.warning('Solo se permiten JPEG, PNG o WEBP.', 'Formato inválido');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.toastr.warning('La imagen no puede superar 5 MB.', 'Archivo grande');
      return;
    }

    this.cargandoFoto.set(true);
    this.errorFoto.set('');
    refreshView(this.cd);

    this.usuarioService.subirFotoPerfil(file).subscribe({
      next: (perfil) => {
        this.perfil.set(perfil);
        this.authService.updateFotoPerfil(perfil.fotoPerfilUrl);
        this.cargandoFoto.set(false);
        this.toastr.success('Foto de perfil actualizada', 'Listo');
        refreshView(this.cd);
      },
      error: (error) => {
        this.cargandoFoto.set(false);
        const msg = getErrorMessage(error, 'No se pudo subir la foto.');
        this.errorFoto.set(msg);
        this.toastr.error(msg, 'Error');
        refreshView(this.cd);
      },
    });
  }

  quitarFoto(): void {
    if (!this.fotoUrl() || this.cargandoFoto()) return;

    this.cargandoFoto.set(true);
    this.errorFoto.set('');
    refreshView(this.cd);

    this.usuarioService.eliminarFotoPerfil().subscribe({
      next: (perfil) => {
        this.perfil.set(perfil);
        this.authService.updateFotoPerfil(null);
        this.cargandoFoto.set(false);
        this.toastr.success('Foto de perfil eliminada', 'Listo');
        refreshView(this.cd);
      },
      error: (error) => {
        this.cargandoFoto.set(false);
        const msg = getErrorMessage(error, 'No se pudo eliminar la foto.');
        this.errorFoto.set(msg);
        this.toastr.error(msg, 'Error');
        refreshView(this.cd);
      },
    });
  }
}

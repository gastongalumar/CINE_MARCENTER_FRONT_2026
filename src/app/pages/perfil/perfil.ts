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
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth';
import { UsuarioService } from '../../services/usuario';
import { ImageService } from '../../services/image';
import { AuthResponse } from '../../models/auth';
import { Usuario } from '../../models/usuario';
import { InicialesPipe } from '../../pipes/iniciales';
import { FechaApiPipe } from '../../pipes/fecha-api';
import { getErrorMessage } from '../../utils/api-error';
import { refreshView } from '../../utils/refresh-view';
import {
  CODIGO_AREA_PATTERN,
  NUMERO_LOCAL_PATTERN,
  armarTelefonoLocal,
  partirTelefonoLocal,
  telefonoLocalCompleto,
} from '../../utils/telefono';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, InicialesPipe, FechaApiPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.css'],
})
export class PerfilComponent {
  private readonly authService = inject(AuthService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly imageService = inject(ImageService);
  private readonly toastr = inject(ToastrService);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);

  constructor() {
    afterNextRender(() => this.cargarPerfil());
  }

  readonly perfil = signal<Usuario | null>(null);
  readonly editando = signal(false);
  readonly cargandoFoto = signal(false);
  readonly cargandoDatos = signal(false);
  readonly errorFoto = signal('');

  readonly form = this.fb.nonNullable.group(
    {
      nombre: ['', [Validators.required, Validators.maxLength(20)]],
      apellido: ['', [Validators.required, Validators.maxLength(20)]],
      codigoArea: ['', Validators.pattern(CODIGO_AREA_PATTERN)],
      numeroLocal: ['', Validators.pattern(NUMERO_LOCAL_PATTERN)],
    },
    { validators: telefonoLocalCompleto }
  );

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

  readonly telefonoVisible = computed(() => {
    const tel = this.perfil()?.telefono;
    if (!tel) return '—';
    const { codigoArea, numeroLocal } = partirTelefonoLocal(tel);
    return codigoArea && numeroLocal ? `${codigoArea} ${numeroLocal}` : tel;
  });

  empezarEdicion(): void {
    const p = this.perfil();
    if (p) {
      this.rellenarFormulario(p);
    }
    this.editando.set(true);
    refreshView(this.cd);
  }

  cancelarEdicion(): void {
    const p = this.perfil();
    if (p) {
      this.rellenarFormulario(p);
    }
    this.editando.set(false);
    refreshView(this.cd);
  }

  cargarPerfil(): void {
    if (!this.authService.isAuthenticated()) return;

    this.usuarioService.obtenerMiPerfil().subscribe({
      next: (perfil) => {
        this.perfil.set(perfil);
        this.authService.updateFotoPerfil(perfil.fotoPerfilUrl);
        this.rellenarFormulario(perfil);
        refreshView(this.cd);
      },
      error: () => {
        const u = this.user();
        if (u?.nombre) {
          const partes = u.nombre.trim().split(/\s+/);
          this.form.patchValue({
            nombre: partes[0] ?? '',
            apellido: partes.slice(1).join(' ') || '',
          });
        }
        refreshView(this.cd);
      },
    });
  }

  private rellenarFormulario(perfil: Usuario): void {
    const { codigoArea, numeroLocal } = partirTelefonoLocal(perfil.telefono);
    this.form.reset({
      nombre: perfil.nombre ?? '',
      apellido: perfil.apellido ?? '',
      codigoArea,
      numeroLocal,
    });
  }

  esInvalido(campo: string): boolean {
    const control = this.form.get(campo);
    return !!control && control.invalid && control.touched;
  }

  telefonoIncompleto(): boolean {
    return (
      (this.form.hasError('telefonoIncompleto') || this.form.hasError('telefonoInvalido')) &&
      (this.form.get('codigoArea')?.touched || this.form.get('numeroLocal')?.touched || false)
    );
  }

  guardarDatos(): void {
    if (this.form.invalid || this.cargandoDatos()) {
      this.form.markAllAsTouched();
      refreshView(this.cd);
      return;
    }

    const { nombre, apellido, codigoArea, numeroLocal } = this.form.getRawValue();
    this.cargandoDatos.set(true);
    refreshView(this.cd);

    this.usuarioService
      .actualizarMiPerfil({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        telefono: armarTelefonoLocal(codigoArea, numeroLocal) ?? null,
      })
      .subscribe({
        next: (perfil) => {
          this.perfil.set(perfil);
          this.authService.updateDisplayName(perfil.nombre, perfil.apellido);
          this.rellenarFormulario(perfil);
          this.editando.set(false);
          this.cargandoDatos.set(false);
          this.toastr.success('Datos actualizados', 'Listo');
          refreshView(this.cd);
        },
        error: (error) => {
          this.cargandoDatos.set(false);
          this.toastr.error(getErrorMessage(error, 'No se pudieron guardar los datos.'), 'Error');
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

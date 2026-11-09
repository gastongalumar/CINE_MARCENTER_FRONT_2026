import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { MensajeResponse, Usuario } from '../models/usuario';
import { skipErrorToastContext } from '../utils/http.context';

/**
 * Servicio HTTP de usuarios.
 * - Admin: listados, búsqueda, baja/reactivación y borrado de admins.
 * - Cliente/Admin: perfil propio y foto.
 */
@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/usuarios`;

  /** GET /api/usuarios */
  listar(opciones?: { skipErrorToast?: boolean }): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl, {
      context: opciones?.skipErrorToast ? skipErrorToastContext() : undefined,
    });
  }

  /** GET /api/usuarios/rol/{rol} */
  listarPorRol(
    rol: 'ADMINISTRADOR' | 'CLIENTE',
    opciones?: { skipErrorToast?: boolean }
  ): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/rol/${rol}`, {
      context: opciones?.skipErrorToast ? skipErrorToastContext() : undefined,
    });
  }

  /** GET /api/usuarios/buscar?nombre= */
  buscar(nombre: string, opciones?: { skipErrorToast?: boolean }): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/buscar`, {
      params: { nombre },
      context: opciones?.skipErrorToast ? skipErrorToastContext() : undefined,
    });
  }

  /** PUT /api/usuarios/{id}/baja */
  darDeBaja(id: number): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}/baja`, {});
  }

  /** PUT /api/usuarios/{id}/activar */
  reactivar(id: number): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}/activar`, {});
  }

  /** DELETE /api/usuarios/{id} — solo administradores (no el admin del sistema). */
  eliminar(id: number): Observable<MensajeResponse> {
    return this.http.delete<MensajeResponse>(`${this.apiUrl}/${id}`);
  }

  /** GET /api/usuarios/me */
  obtenerMiPerfil(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/me`);
  }

  /** POST /api/usuarios/me/foto (multipart field `foto`) */
  subirFotoPerfil(file: File): Observable<Usuario> {
    const formData = new FormData();
    formData.append('foto', file);
    return this.http.post<Usuario>(`${this.apiUrl}/me/foto`, formData, {
      context: skipErrorToastContext(),
    });
  }

  /** DELETE /api/usuarios/me/foto */
  eliminarFotoPerfil(): Observable<Usuario> {
    return this.http.delete<Usuario>(`${this.apiUrl}/me/foto`, {
      context: skipErrorToastContext(),
    });
  }
}

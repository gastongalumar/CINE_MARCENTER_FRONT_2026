import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ActualizarNombreUsuarioRequest, MensajeResponse, Usuario } from '../models/usuario';

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
  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  /** GET /api/usuarios/rol/{rol} */
  listarPorRol(rol: 'ADMINISTRADOR' | 'SUPERADMIN' | 'CLIENTE'): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/rol/${rol}`);
  }

  /** GET /api/usuarios/buscar?nombre= */
  buscar(nombre: string): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/buscar`, {
      params: { nombre },
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

  /** PUT /api/usuarios/mi-nombre — nombre, apellido y teléfono. */
  actualizarMiPerfil(data: ActualizarNombreUsuarioRequest): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/mi-nombre`, data);
  }

  /** POST /api/usuarios/me/foto (multipart field `foto`) */
  subirFotoPerfil(file: File): Observable<Usuario> {
    const formData = new FormData();
    formData.append('foto', file);
    return this.http.post<Usuario>(`${this.apiUrl}/me/foto`, formData);
  }

  /** DELETE /api/usuarios/me/foto */
  eliminarFotoPerfil(): Observable<Usuario> {
    return this.http.delete<Usuario>(`${this.apiUrl}/me/foto`);
  }
}

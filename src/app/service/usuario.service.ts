import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Usuario } from '../models/usuario.model';

/**
 * Servicio HTTP de usuarios.
 * - Admin: listados y búsqueda.
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
  listarPorRol(rol: 'ADMINISTRADOR' | 'CLIENTE'): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/rol/${rol}`);
  }

  /** GET /api/usuarios/buscar?nombre= */
  buscar(nombre: string): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/buscar`, {
      params: { nombre },
    });
  }

  /** GET /api/usuarios/me */
  obtenerMiPerfil(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/me`);
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

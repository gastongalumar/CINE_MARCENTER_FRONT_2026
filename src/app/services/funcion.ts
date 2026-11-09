import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Funcion, FuncionRangoRequest, FuncionRequest } from '../models/funcion';
import { MensajeResponse } from '../models/usuario';
import { EstadoAsientos } from '../models/estado-asientos.model';
import { SKIP_ERROR_TOAST } from '../utils/http.context';

/**
 * Servicio HTTP de funciones.
 *
 * El backend expone POST /funciones, POST /funciones/por-rango y
 * DELETE /funciones/{id} (no hay endpoint PUT), por lo que la gestión de
 * funciones en el front es de alta / listado / baja.
 */
@Injectable({
  providedIn: 'root'
})
export class FuncionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/funciones`;

  /** GET /api/funciones — todas las funciones (público). */
  listarTodas(): Observable<Funcion[]> {
    return this.http.get<Funcion[]>(this.apiUrl);
  }

  /** GET /api/funciones/vigentes — funciones futuras o en curso (público). */
  listarVigentes(): Observable<Funcion[]> {
    return this.http.get<Funcion[]>(`${this.apiUrl}/vigentes`);
  }

  /** GET /api/funciones/pelicula/{peliculaId} */
  listarPorPelicula(peliculaId: number): Observable<Funcion[]> {
    return this.http.get<Funcion[]>(`${this.apiUrl}/pelicula/${peliculaId}`);
  }

  /** GET /api/funciones/{id} */
  obtenerPorId(id: number): Observable<Funcion> {
    return this.http.get<Funcion>(`${this.apiUrl}/${id}`);
  }

  /** GET /api/funciones/{funcionId}/ocupados → etiquetas de los asientos reservados. */
  obtenerAsientosOcupados(funcionId: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/${funcionId}/ocupados`);
  }

  /** GET /api/funciones/{funcionId}/estado-asientos → estado y holds vigentes. */
  obtenerEstadoAsientos(funcionId: number): Observable<EstadoAsientos> {
    return this.http.get<EstadoAsientos>(`${this.apiUrl}/${funcionId}/estado-asientos`, {
      context: new HttpContext().set(SKIP_ERROR_TOAST, true),
    });
  }

  /** POST /api/funciones — crear una función (ADMIN). */
  crear(funcion: FuncionRequest): Observable<Funcion> {
    return this.http.post<Funcion>(this.apiUrl, funcion);
  }

  /** POST /api/funciones/por-rango — generar funciones consecutivas (ADMIN). */
  crearPorRango(payload: FuncionRangoRequest): Observable<Funcion[]> {
    return this.http.post<Funcion[]>(`${this.apiUrl}/por-rango`, payload);
  }

  /** DELETE /api/funciones/{id} — eliminar una función (ADMIN). */
  eliminar(id: number): Observable<MensajeResponse> {
    return this.http.delete<MensajeResponse>(`${this.apiUrl}/${id}`);
  }
}

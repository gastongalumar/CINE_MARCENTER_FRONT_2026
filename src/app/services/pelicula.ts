import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Pelicula, PeliculaRequest } from '../models/pelicula';
import { GeneroPelicula } from '../models/genero-pelicula';
import { MensajeResponse } from '../models/usuario';

/** Servicio HTTP de películas (CRUD completo: alta, lectura, edición y baja). */
@Injectable({
  providedIn: 'root'
})
export class PeliculaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/peliculas`;

  /** GET /api/peliculas — listado completo (público). */
  listarTodas(): Observable<Pelicula[]> {
    return this.http.get<Pelicula[]>(this.apiUrl);
  }

  /** GET /api/peliculas/vigentes — películas en cartelera (público). */
  listarVigentes(): Observable<Pelicula[]> {
    return this.http.get<Pelicula[]>(`${this.apiUrl}/vigentes`);
  }

  /** GET /api/peliculas/proximamente — próximos estrenos (público). */
  listarProximamente(): Observable<Pelicula[]> {
    return this.http.get<Pelicula[]>(`${this.apiUrl}/proximamente`);
  }

  /** GET /api/peliculas/{id} */
  obtenerPorId(id: number): Observable<Pelicula> {
    return this.http.get<Pelicula>(`${this.apiUrl}/${id}`);
  }

  /** POST /api/peliculas — crear película (ADMIN). */
  crear(pelicula: PeliculaRequest): Observable<Pelicula> {
    return this.http.post<Pelicula>(this.apiUrl, pelicula);
  }

  /** PUT /api/peliculas/{id} — actualizar película (ADMIN). */
  actualizar(id: number, pelicula: Partial<PeliculaRequest>): Observable<Pelicula> {
    return this.http.put<Pelicula>(`${this.apiUrl}/${id}`, pelicula);
  }

  /** DELETE /api/peliculas/{id} — eliminar película (ADMIN). */
  eliminar(id: number): Observable<MensajeResponse> {
    return this.http.delete<MensajeResponse>(`${this.apiUrl}/${id}`);
  }

  /** GET /api/peliculas/filtro/nombre?nombre= */
  filtrarPorNombre(nombre: string): Observable<Pelicula[]> {
    return this.http.get<Pelicula[]>(`${this.apiUrl}/filtro/nombre`, {
      params: { nombre },
    });
  }

  /** GET /api/peliculas/filtro/genero?genero= */
  filtrarPorGenero(genero: GeneroPelicula): Observable<Pelicula[]> {
    return this.http.get<Pelicula[]>(`${this.apiUrl}/filtro/genero`, {
      params: { genero },
    });
  }

  /** GET /api/peliculas/filtro/funcion/{funcionId} */
  filtrarPorFuncion(funcionId: number): Observable<Pelicula[]> {
    return this.http.get<Pelicula[]>(`${this.apiUrl}/filtro/funcion/${funcionId}`);
  }

  /**
   * POST /api/peliculas/{id}/imagen — carga del póster (multipart, campo `file`).
   * Emite eventos HTTP para poder mostrar el progreso de la subida.
   */
  subirImagen(id: number, file: File): Observable<HttpEvent<MensajeResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<MensajeResponse>(`${this.apiUrl}/${id}/imagen`, formData, {
      reportProgress: true,
      observe: 'events',
    });
  }
}

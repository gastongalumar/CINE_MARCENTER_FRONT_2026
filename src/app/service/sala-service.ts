import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// import { environment } from '../../environments/environment';
// import { Sala, SalaRequest } from '../models/sala.model';
// import { Asiento } from '../models/asiento.model';
// import { MensajeResponse } from '../models/usuario.model';

/** Servicio HTTP de salas (CRUD completo: alta, lectura, edición y baja). */
@Injectable({
  providedIn: 'root'
})
export class SalaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/salas`;

  /** GET /api/salas */
  listarTodas(): Observable<Sala[]> {
    return this.http.get<Sala[]>(this.apiUrl);
  }

  /** GET /api/salas/{id} */
  obtenerPorId(id: number): Observable<Sala> {
    return this.http.get<Sala>(`${this.apiUrl}/${id}`);
  }

  /** GET /api/salas/{id}/asientos — mapa de butacas de la sala. */
  listarAsientos(id: number): Observable<Asiento[]> {
    return this.http.get<Asiento[]>(`${this.apiUrl}/${id}/asientos`);
  }

  /** POST /api/salas — crear sala (ADMIN). */
  crear(sala: SalaRequest): Observable<Sala> {
    return this.http.post<Sala>(this.apiUrl, sala);
  }

  /** PUT /api/salas/{id} — actualizar sala (ADMIN). */
  actualizar(id: number, sala: SalaRequest): Observable<Sala> {
    return this.http.put<Sala>(`${this.apiUrl}/${id}`, sala);
  }

  /** DELETE /api/salas/{id} — eliminar sala (ADMIN). */
  eliminar(id: number): Observable<MensajeResponse> {
    return this.http.delete<MensajeResponse>(`${this.apiUrl}/${id}`);
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Reserva, ReservaRequest } from '../models/reserva';
import { ValidacionTicketResponse } from '../models/validacion-ticket';
import { MensajeResponse } from '../models/usuario';
import { skipErrorToastContext } from '../utils/http.context';

/**
 * Servicio HTTP de reservas y tickets.
 *
 * - `POST /api/reservas` requiere rol CLIENTE.
 * - `GET /api/reservas/mis` funciona para CLIENTE y ADMINISTRADOR.
 * - Los endpoints `/api/reservas/admin/**` requieren rol ADMINISTRADOR.
 */
@Injectable({
  providedIn: 'root'
})
export class ReservaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/reservas`;

  /** POST /api/reservas — crear una reserva (CLIENTE). */
  crearReserva(request: ReservaRequest): Observable<Reserva> {
    return this.http.post<Reserva>(this.apiUrl, request);
  }

  /** GET /api/reservas/mis — reservas del usuario autenticado. */
  listarMisReservas(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.apiUrl}/mis`);
  }

  /** GET /api/reservas/ticket/{numeroTicket} */
  obtenerPorTicket(numeroTicket: string): Observable<Reserva> {
    return this.http.get<Reserva>(`${this.apiUrl}/ticket/${numeroTicket}`);
  }

  /** DELETE /api/reservas/ticket/{numeroTicket} — cancelar una reserva. */
  cancelarReserva(numeroTicket: string): Observable<MensajeResponse> {
    return this.http.delete<MensajeResponse>(`${this.apiUrl}/ticket/${numeroTicket}`);
  }

  /** POST /api/reservas/validar/{numeroTicket}?marcarUsado= (ADMIN). */
  validarTicket(numeroTicket: string, marcarUsado: boolean): Observable<ValidacionTicketResponse> {
    return this.http.post<ValidacionTicketResponse>(
      `${this.apiUrl}/validar/${numeroTicket}`,
      null,
      {
        params: { marcarUsado: String(marcarUsado) },
        context: skipErrorToastContext(),
      }
    );
  }

  /** GET /api/reservas/admin/todas — todas las reservas (ADMIN). */
  listarTodas(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.apiUrl}/admin/todas`);
  }

  /** GET /api/reservas/admin/funcion/{funcionId} (ADMIN). */
  filtrarPorFuncion(funcionId: number): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.apiUrl}/admin/funcion/${funcionId}`);
  }

  /** GET /api/reservas/admin/sala/{salaId} (ADMIN). */
  filtrarPorSala(salaId: number): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.apiUrl}/admin/sala/${salaId}`);
  }

  /** GET /api/reservas/admin/fechas?desde=&hasta= (ADMIN). */
  filtrarPorFechas(desde: string, hasta: string): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.apiUrl}/admin/fechas`, {
      params: { desde, hasta },
    });
  }
}

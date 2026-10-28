import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  DashboardResumen,
  MetodoPagoEstadistica,
  OcupacionFuncion,
  VentaDiaria,
  VentaPelicula,
  VentaSala,
} from '../models/estadisticas.model';

/**
 * Servicio de estadísticas del panel de administración.
 * Todos los endpoints requieren rol ADMINISTRADOR en el backend.
 */
@Injectable({
  providedIn: 'root'
})
export class EstadisticasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/estadisticas`;

  /** GET /api/estadisticas/dashboard/resumen */
  resumen(): Observable<DashboardResumen> {
    return this.http.get<DashboardResumen>(`${this.apiUrl}/dashboard/resumen`);
  }

  /** GET /api/estadisticas/reservas/por-fecha?dias= (1..365) */
  ventasPorFecha(dias = 30): Observable<VentaDiaria[]> {
    return this.http.get<VentaDiaria[]>(`${this.apiUrl}/reservas/por-fecha`, {
      params: { dias: String(dias) },
    });
  }

  /** GET /api/estadisticas/ocupacion/pelicula */
  ventasPorPelicula(): Observable<VentaPelicula[]> {
    return this.http.get<VentaPelicula[]>(`${this.apiUrl}/ocupacion/pelicula`);
  }

  /** GET /api/estadisticas/ocupacion/sala */
  ventasPorSala(): Observable<VentaSala[]> {
    return this.http.get<VentaSala[]>(`${this.apiUrl}/ocupacion/sala`);
  }

  /** GET /api/estadisticas/ocupacion/funcion?soloVigentes= */
  ocupacionFunciones(soloVigentes = false): Observable<OcupacionFuncion[]> {
    return this.http.get<OcupacionFuncion[]>(`${this.apiUrl}/ocupacion/funcion`, {
      params: { soloVigentes: String(soloVigentes) },
    });
  }

  /** GET /api/estadisticas/ingresos/metodos-pago */
  metodosPago(): Observable<MetodoPagoEstadistica[]> {
    return this.http.get<MetodoPagoEstadistica[]>(`${this.apiUrl}/ingresos/metodos-pago`);
  }
}

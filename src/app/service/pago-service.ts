import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// import { environment } from '../../environments/environment';

export interface CrearPreferenciaRequest {
  reservaId: number;
}

export interface CrearPreferenciaResponse {
  init_point: string;
  sandbox_init_point?: string;
  preference_id: string;
}

@Injectable({
  providedIn: 'root'
})
export class PagoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/pagos`;

  crearPreferencia(reservaId: number): Observable<CrearPreferenciaResponse> {
    return this.http.post<CrearPreferenciaResponse>(`${this.apiUrl}/crear-preferencia`, { reservaId });
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { HoldRequest, HoldResponse } from '../models/hold.model';
import { MensajeResponse } from '../models/usuario';
import { skipErrorToastContext } from '../utils/http.context';

@Injectable({
  providedIn: 'root',
})
export class HoldService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/holds`;

  crear(funcionId: number, etiqueta: string): Observable<HoldResponse> {
    const body: HoldRequest = { funcionId, etiqueta };
    return this.http.post<HoldResponse>(this.apiUrl, body, {
      context: skipErrorToastContext(),
    });
  }

  liberar(funcionId: number, etiqueta: string): Observable<MensajeResponse> {
    const body: HoldRequest = { funcionId, etiqueta };
    return this.http.request<MensajeResponse>('DELETE', this.apiUrl, {
      body,
      context: skipErrorToastContext(),
    });
  }

  liberarTodos(funcionId: number): Observable<MensajeResponse> {
    return this.http.delete<MensajeResponse>(`${this.apiUrl}/funcion/${funcionId}`, {
      context: skipErrorToastContext(),
    });
  }
}

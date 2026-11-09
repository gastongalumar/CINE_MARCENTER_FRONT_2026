import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CandyCombo, CandyComboRequest } from '../models/candy-combo';
import { MensajeResponse } from '../models/usuario';

@Injectable({ providedIn: 'root' })
export class CandyComboService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/candy-combos`;

  listarActivos(): Observable<CandyCombo[]> {
    return this.http.get<CandyCombo[]>(`${this.apiUrl}/activos`);
  }

  listarTodos(): Observable<CandyCombo[]> {
    return this.http.get<CandyCombo[]>(this.apiUrl);
  }

  obtener(id: number): Observable<CandyCombo> {
    return this.http.get<CandyCombo>(`${this.apiUrl}/${id}`);
  }

  crear(data: CandyComboRequest): Observable<CandyCombo> {
    return this.http.post<CandyCombo>(this.apiUrl, data);
  }

  actualizar(id: number, data: CandyComboRequest): Observable<CandyCombo> {
    return this.http.put<CandyCombo>(`${this.apiUrl}/${id}`, data);
  }

  eliminar(id: number): Observable<MensajeResponse> {
    return this.http.delete<MensajeResponse>(`${this.apiUrl}/${id}`);
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CodigoDescuento,
  CodigoDescuentoRequest,
  ValidarCodigoResponse,
} from '../models/codigo-descuento';
import { MensajeResponse } from '../models/usuario';

@Injectable({ providedIn: 'root' })
export class CodigoDescuentoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/codigos-descuento`;

  validar(codigo: string, subtotal: number): Observable<ValidarCodigoResponse> {
    return this.http.post<ValidarCodigoResponse>(`${this.apiUrl}/validar`, { codigo, subtotal });
  }

  listar(): Observable<CodigoDescuento[]> {
    return this.http.get<CodigoDescuento[]>(this.apiUrl);
  }

  obtener(id: number): Observable<CodigoDescuento> {
    return this.http.get<CodigoDescuento>(`${this.apiUrl}/${id}`);
  }

  crear(data: CodigoDescuentoRequest): Observable<CodigoDescuento> {
    return this.http.post<CodigoDescuento>(this.apiUrl, data);
  }

  actualizar(id: number, data: CodigoDescuentoRequest): Observable<CodigoDescuento> {
    return this.http.put<CodigoDescuento>(`${this.apiUrl}/${id}`, data);
  }

  eliminar(id: number): Observable<MensajeResponse> {
    return this.http.delete<MensajeResponse>(`${this.apiUrl}/${id}`);
  }
}

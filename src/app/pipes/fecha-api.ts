import { Pipe, PipeTransform } from '@angular/core';
import { formatDate } from '@angular/common';
import { parseApiDateTime } from '../utils/datetime';

/**
 * Formatea fechas/horarios que llegan del backend sin aplicar desfase de zona.
 * Ej.: "2026-06-15T20:00:00" → "15/06/2026 20:00".
 */
@Pipe({
  name: 'fechaApi',
  standalone: true,
})
export class FechaApiPipe implements PipeTransform {
  transform(value: string | Date | null | undefined, format = 'dd/MM/yyyy HH:mm'): string {
    if (!value) return '';

    const fecha = value instanceof Date ? value : parseApiDateTime(value);
    if (!fecha) return String(value);

    return formatDate(fecha, format, 'es-AR');
  }
}

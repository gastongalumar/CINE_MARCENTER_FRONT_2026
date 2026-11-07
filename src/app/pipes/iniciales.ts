import { Pipe, PipeTransform } from '@angular/core';

/**
 * Genera las iniciales de un nombre completo.
 * Ej.: "Juan Pérez" → "JP"; "Cinemacenter" → "C".
 */
@Pipe({
  name: 'iniciales',
  standalone: true,
})
export class InicialesPipe implements PipeTransform {
  transform(nombre: string | null | undefined): string {
    if (!nombre) return '';

    const partes = nombre
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);

    if (partes.length === 0) return '';
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase();

    return (partes[0].charAt(0) + partes[1].charAt(0)).toUpperCase();
  }
}

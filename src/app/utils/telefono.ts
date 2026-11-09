import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Arma el teléfono nacional (10 dígitos) a partir de código de área + número local.
 * Ej.: "0223" + "5678912" → "2235678912"
 * No incluye prefijo 15 ni +54.
 */
export function armarTelefonoLocal(
  codigoArea: string | null | undefined,
  numero: string | null | undefined
): string | undefined {
  const area = (codigoArea ?? '').replace(/\D/g, '').replace(/^0+/, '');
  const local = (numero ?? '').replace(/\D/g, '');

  if (!area && !local) {
    return undefined;
  }

  return `${area}${local}`;
}

/** Código de área AR: opcional 0 + 2 a 4 dígitos (ej. 0223, 011, 0351). */
export const CODIGO_AREA_PATTERN = /^0?\d{2,4}$/;

/** Número local sin 15: 6 a 8 dígitos (ej. 5678912). */
export const NUMERO_LOCAL_PATTERN = /^(?!15)\d{6,8}$/;

/**
 * Separa un teléfono nacional de 10 dígitos en código de área (con 0) + número local.
 * Heurística: 011 + 8 dígitos; resto área de 3 dígitos + 7.
 */
export function partirTelefonoLocal(telefono: string | null | undefined): {
  codigoArea: string;
  numeroLocal: string;
} {
  const n = (telefono ?? '').replace(/\D/g, '');
  if (!n) {
    return { codigoArea: '', numeroLocal: '' };
  }
  if (n.length === 10 && n.startsWith('11')) {
    return { codigoArea: '011', numeroLocal: n.slice(2) };
  }
  if (n.length === 10) {
    return { codigoArea: `0${n.slice(0, 3)}`, numeroLocal: n.slice(3) };
  }
  return { codigoArea: '', numeroLocal: n };
}

/** Si hay área o número, exige ambos y que armados den 10 dígitos. */
export function telefonoLocalCompleto(group: AbstractControl): ValidationErrors | null {
  const areaRaw = String(group.get('codigoArea')?.value ?? '').trim();
  const localRaw = String(group.get('numeroLocal')?.value ?? '').trim();

  if (!areaRaw && !localRaw) {
    return null;
  }

  if (!areaRaw || !localRaw) {
    return { telefonoIncompleto: true };
  }

  const armado = armarTelefonoLocal(areaRaw, localRaw);
  if (!armado || armado.length !== 10) {
    return { telefonoInvalido: true };
  }

  return null;
}

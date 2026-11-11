import { FormControl, FormGroup } from '@angular/forms';
import {
  CODIGO_AREA_PATTERN,
  NUMERO_LOCAL_PATTERN,
  armarTelefonoLocal,
  partirTelefonoLocal,
  telefonoLocalCompleto,
} from './telefono';

describe('telefono utils', () => {
  describe('armarTelefonoLocal', () => {
    it('arma 10 dígitos quitando 0 del área', () => {
      expect(armarTelefonoLocal('0223', '5678912')).toBe('2235678912');
    });

    it('devuelve undefined si ambos vacíos', () => {
      expect(armarTelefonoLocal('', '')).toBeUndefined();
      expect(armarTelefonoLocal(null, undefined)).toBeUndefined();
    });

    it('stripea no-dígitos', () => {
      expect(armarTelefonoLocal('0-223', '567-8912')).toBe('2235678912');
    });
  });

  describe('partirTelefonoLocal', () => {
    it('parte 011 + 8 dígitos', () => {
      expect(partirTelefonoLocal('1156789012')).toEqual({
        codigoArea: '011',
        numeroLocal: '56789012',
      });
    });

    it('parte resto como área 3 + local 7', () => {
      expect(partirTelefonoLocal('2235678912')).toEqual({
        codigoArea: '0223',
        numeroLocal: '5678912',
      });
    });

    it('vacío → strings vacíos', () => {
      expect(partirTelefonoLocal(null)).toEqual({ codigoArea: '', numeroLocal: '' });
    });

    it('longitud distinta de 10 deja todo en numeroLocal', () => {
      expect(partirTelefonoLocal('12345')).toEqual({ codigoArea: '', numeroLocal: '12345' });
    });
  });

  describe('patterns', () => {
    it('CODIGO_AREA_PATTERN acepta 0223 / 011 / 0351', () => {
      expect(CODIGO_AREA_PATTERN.test('0223')).toBe(true);
      expect(CODIGO_AREA_PATTERN.test('011')).toBe(true);
      expect(CODIGO_AREA_PATTERN.test('0351')).toBe(true);
      expect(CODIGO_AREA_PATTERN.test('1')).toBe(false);
    });

    it('NUMERO_LOCAL_PATTERN rechaza prefijo 15', () => {
      expect(NUMERO_LOCAL_PATTERN.test('5678912')).toBe(true);
      expect(NUMERO_LOCAL_PATTERN.test('15567890')).toBe(false);
      expect(NUMERO_LOCAL_PATTERN.test('12345')).toBe(false);
    });
  });

  describe('telefonoLocalCompleto', () => {
    function group(codigoArea: string, numeroLocal: string) {
      return new FormGroup({
        codigoArea: new FormControl(codigoArea),
        numeroLocal: new FormControl(numeroLocal),
      });
    }

    it('null si ambos vacíos', () => {
      expect(telefonoLocalCompleto(group('', ''))).toBeNull();
    });

    it('telefonoIncompleto si falta uno', () => {
      expect(telefonoLocalCompleto(group('0223', ''))).toEqual({ telefonoIncompleto: true });
      expect(telefonoLocalCompleto(group('', '5678912'))).toEqual({ telefonoIncompleto: true });
    });

    it('telefonoInvalido si no arma 10 dígitos', () => {
      expect(telefonoLocalCompleto(group('0223', '12'))).toEqual({ telefonoInvalido: true });
    });

    it('null si armado válido', () => {
      expect(telefonoLocalCompleto(group('0223', '5678912'))).toBeNull();
    });
  });
});

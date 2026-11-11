import { decodeJwtPayload, isJwtExpired } from './jwt';
import { createExpiredJwt, createFakeJwt, toBase64Url } from '../../testing/jwt-factory';

describe('jwt utils', () => {
  describe('decodeJwtPayload', () => {
    it('devuelve null para token vacío o inválido', () => {
      expect(decodeJwtPayload(null)).toBeNull();
      expect(decodeJwtPayload(undefined)).toBeNull();
      expect(decodeJwtPayload('')).toBeNull();
      expect(decodeJwtPayload('solo.dos')).toBeNull();
      expect(decodeJwtPayload('a.b.c.d')).toBeNull();
      expect(decodeJwtPayload('aaa.!!!notbase64!!!.bbb')).toBeNull();
    });

    it('decodifica claims con padding base64url', () => {
      const token = createFakeJwt({
        claims: { sub: 'a@b.com', tipo: 'ADMINISTRADOR', userId: 42 },
      });
      const claims = decodeJwtPayload(token);
      expect(claims?.sub).toBe('a@b.com');
      expect(claims?.tipo).toBe('ADMINISTRADOR');
      expect(claims?.userId).toBe(42);
    });

    it('acepta payload que necesita padding (=)', () => {
      // payload corto que no es múltiplo de 4 en base64url
      const header = toBase64Url({ alg: 'none' });
      const payload = toBase64Url({ sub: 'x' });
      const token = `${header}.${payload}.sig`;
      expect(decodeJwtPayload(token)?.sub).toBe('x');
    });
  });

  describe('isJwtExpired', () => {
    it('true si no hay token o no se puede leer exp', () => {
      expect(isJwtExpired(null)).toBe(true);
      expect(isJwtExpired('bad')).toBe(true);
      expect(isJwtExpired(createFakeJwt({ exp: null }))).toBe(true);
    });

    it('respeta el boundary exacto de exp', () => {
      const ahora = 1_700_000_000;
      const token = createFakeJwt({ exp: ahora });
      expect(isJwtExpired(token, ahora)).toBe(true);
      expect(isJwtExpired(token, ahora - 1)).toBe(false);
    });

    it('detecta tokens expirados', () => {
      expect(isJwtExpired(createExpiredJwt())).toBe(true);
    });
  });
});

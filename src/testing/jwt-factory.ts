import type { JwtClaims } from '../app/utils/jwt';

/** Codifica un objeto como segmento base64url (sin validar firma). */
export function toBase64Url(value: unknown): string {
  const json = typeof value === 'string' ? value : JSON.stringify(value);
  const base64 = btoa(json);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export interface FakeJwtOptions {
  claims?: Partial<JwtClaims>;
  /** Epoch seconds. Default: now + 1h. Pass null to omit `exp`. */
  exp?: number | null;
  iat?: number;
  header?: Record<string, unknown>;
}

/** Construye un JWT falso decodificable por `decodeJwtPayload` (firma dummy). */
export function createFakeJwt(options: FakeJwtOptions = {}): string {
  const now = Math.floor(Date.now() / 1000);
  const claims: JwtClaims = {
    sub: 'cliente@test.com',
    tipo: 'CLIENTE',
    userId: 1,
    nombre: 'Test',
    apellido: 'User',
    nombreCompleto: 'Test User',
    iat: options.iat ?? now,
    ...options.claims,
  };

  if (options.exp === null) {
    delete claims.exp;
  } else {
    claims.exp = options.exp ?? now + 3600;
  }

  const header = toBase64Url(options.header ?? { alg: 'none', typ: 'JWT' });
  const payload = toBase64Url(claims);
  return `${header}.${payload}.fakesignature`;
}

export function createExpiredJwt(claims?: Partial<JwtClaims>): string {
  const now = Math.floor(Date.now() / 1000);
  return createFakeJwt({ claims, exp: now - 60 });
}

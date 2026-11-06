import type { TipoUsuario } from '../models/auth.model';

export interface DecodedJwtClaims {
  sub?: string;
  email?: string;
  userId?: number | string;
  tipo?: TipoUsuario;
  nombre?: string;
  apellido?: string;
  nombreCompleto?: string;
  fotoPerfilUrl?: string | null;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

export function decodeJwtPayload(token?: string | null): DecodedJwtClaims | null {
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload.length % 4 === 0 ? payload : payload + '='.repeat(4 - (payload.length % 4));
    const binary = atob(padded);
    const json = decodeURIComponent(
      Array.from(binary, (char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`).join('')
    );
    return JSON.parse(json) as DecodedJwtClaims;
  } catch {
    return null;
  }
}

export function isJwtExpired(token?: string | null): boolean {
  const claims = decodeJwtPayload(token);
  if (!claims || typeof claims.exp !== 'number') {
    return false;
  }

  return claims.exp <= Math.floor(Date.now() / 1000);
}

/**
 * Utilidades para trabajar con el JWT que emite el backend
 * (ver `GESTOR_CINEMAR_CENTER.DEV.security.JwtUtil`).
 *
 * El token es un JWT HS256 con los claims:
 *  - `sub`             → email del usuario
 *  - `tipo`            → rol (ADMINISTRADOR | CLIENTE)
 *  - `userId`          → id del usuario
 *  - `nombre`          → nombre
 *  - `apellido`        → apellido
 *  - `nombreCompleto`  → nombre + apellido
 *  - `fotoPerfilUrl`   → ruta de foto de perfil (opcional)
 *  - `iat` / `exp`     → issued-at y expiración (epoch en segundos)
 *
 * Decodificamos el payload en el cliente (no se valida la firma: eso es
 * responsabilidad del backend) para leer el rol y detectar expiración.
 */

/** Claims decodificados del JWT. */
export interface JwtClaims {
  sub?: string;
  tipo?: string;
  userId?: number;
  nombre?: string;
  apellido?: string;
  nombreCompleto?: string;
  fotoPerfilUrl?: string;
  iat?: number;
  exp?: number;
}

/** Decodifica el payload de un JWT sin validar la firma. Devuelve null si es inválido. */
export function decodeJwtPayload(token: string | null | undefined): JwtClaims | null {
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 3 || !parts[1]) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const binario = atob(padded);
    const bytes = Uint8Array.from(binario, (c) => c.charCodeAt(0));
    const json = new TextDecoder('utf-8').decode(bytes);
    const claims = JSON.parse(json);
    return claims && typeof claims === 'object' ? (claims as JwtClaims) : null;
  } catch {
    return null;
  }
}

/** true si el token expiró (o no se puede leer su claim `exp`). */
export function isJwtExpired(token: string | null | undefined, ahoraSegundos = Math.floor(Date.now() / 1000)): boolean {
  const claims = decodeJwtPayload(token);
  if (!claims || typeof claims.exp !== 'number') return true;
  return claims.exp <= ahoraSegundos;
}

export type TipoUsuario = 'SUPERADMIN' | 'ADMINISTRADOR' | 'CLIENTE';

/** Roles con acceso al panel de administración. */
export const ROLES_STAFF: TipoUsuario[] = ['SUPERADMIN', 'ADMINISTRADOR'];

export function esStaff(tipo: TipoUsuario | null | undefined): boolean {
  return tipo === 'SUPERADMIN' || tipo === 'ADMINISTRADOR';
}

export function parseTipoUsuario(valor: string | null | undefined): TipoUsuario | null {
  if (valor === 'SUPERADMIN' || valor === 'ADMINISTRADOR' || valor === 'CLIENTE') {
    return valor;
  }
  return null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegistroRequest {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono?: string;
  /** Solo para registro-admin: ADMINISTRADOR o SUPERADMIN. */
  tipo?: 'ADMINISTRADOR' | 'SUPERADMIN';
}

export interface AuthResponse {
  token: string;
  tipo: TipoUsuario;
  email: string;
  nombre: string;
  id: number;
  fotoPerfilUrl?: string | null;
}

export type TipoUsuario = 'ADMINISTRADOR' | 'CLIENTE';

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
}

export interface AuthResponse {
  token: string;
  tipo: TipoUsuario;
  email: string;
  nombre: string;
  id: number;
  fotoPerfilUrl?: string | null;
}

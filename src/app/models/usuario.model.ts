import { TipoUsuario } from './auth.model';

export type EstadoUsuario = 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';

/** Respuesta de /api/usuarios (UsuarioResponseDTO). */
export interface Usuario {
  id?: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  fotoPerfilUrl?: string | null;
  tipo: TipoUsuario;
  estado: EstadoUsuario;
  fechaRegistro?: string;
  fechaUltimoAcceso?: string;
}

/** Body de PUT /api/usuarios/mi-nombre. */
export interface ActualizarNombreUsuarioRequest {
  nombre: string;
  apellido: string;
}

/** Cuerpo genérico de las respuestas del backend: { "message": "..." } */
export interface MensajeResponse {
  message: string;
}

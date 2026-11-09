import { TipoUsuario } from './auth';

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
  /** Nacional 10 dígitos; omitir o vacío para borrarlo. */
  telefono?: string | null;
}

/** Cuerpo genérico de las respuestas del backend: { "message": "..." } */
export interface MensajeResponse {
  message: string;
}

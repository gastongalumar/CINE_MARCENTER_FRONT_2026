import { GeneroPelicula } from "./genero-pelicula";

/** Respuesta de /api/peliculas (PeliculaResponseDTO). */
export interface Pelicula {
  id?: number;
  nombre: string;
  genero: GeneroPelicula | '';
  /** yyyy-MM-dd */
  fechaEstreno: string;
  /** yyyy-MM-dd */
  fechaSalida: string;
  duracionMinutos: number;
  rutaImagen?: string;
  sinopsis?: string;
  descripcion?: string;
  director?: string;
  elenco?: string;
  clasificacion?: string;
  nominaciones?: string;
  urlTrailer?: string;
}

/** Body de POST /api/peliculas (CrearPeliculaRequestDTO) y PUT /api/peliculas/{id}. */
export interface PeliculaRequest {
  nombre: string;
  genero: GeneroPelicula;
  fechaEstreno: string;
  fechaSalida: string;
  duracionMinutos: number;
  sinopsis?: string;
  descripcion?: string;
  director?: string;
  elenco?: string;
  clasificacion?: string;
  nominaciones?: string;
  urlTrailer?: string;
}

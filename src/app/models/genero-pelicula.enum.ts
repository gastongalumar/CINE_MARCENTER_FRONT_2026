/** Valores del enum GeneroPelicula del backend (POST/PUT /api/peliculas). */
export enum GeneroPelicula {
  ACCION = 'ACCION',
  AVENTURA = 'AVENTURA',
  ANIMACION = 'ANIMACION',
  COMEDIA = 'COMEDIA',
  DRAMA = 'DRAMA',
  DOCUMENTAL = 'DOCUMENTAL',
  FANTASIA = 'FANTASIA',
  MUSICAL = 'MUSICAL',
  ROMANCE = 'ROMANCE',
  CIENCIA_FICCION = 'CIENCIA_FICCION',
  TERROR = 'TERROR',
  THRILLER = 'THRILLER',
  WESTERN = 'WESTERN',
  BIOGRAFIA = 'BIOGRAFIA',
  FAMILIAR = 'FAMILIAR'
}

export const GENEROS_PELICULA: GeneroPelicula[] = Object.values(GeneroPelicula);

const GENERO_LABELS: Record<GeneroPelicula, string> = {
  [GeneroPelicula.ACCION]: 'Acción',
  [GeneroPelicula.AVENTURA]: 'Aventura',
  [GeneroPelicula.ANIMACION]: 'Animación',
  [GeneroPelicula.COMEDIA]: 'Comedia',
  [GeneroPelicula.DRAMA]: 'Drama',
  [GeneroPelicula.DOCUMENTAL]: 'Documental',
  [GeneroPelicula.FANTASIA]: 'Fantasía',
  [GeneroPelicula.MUSICAL]: 'Musical',
  [GeneroPelicula.ROMANCE]: 'Romance',
  [GeneroPelicula.CIENCIA_FICCION]: 'Ciencia ficción',
  [GeneroPelicula.TERROR]: 'Terror',
  [GeneroPelicula.THRILLER]: 'Thriller',
  [GeneroPelicula.WESTERN]: 'Western',
  [GeneroPelicula.BIOGRAFIA]: 'Biografía',
  [GeneroPelicula.FAMILIAR]: 'Familiar'
};

export function etiquetaGenero(genero: string): string {
  return GENERO_LABELS[genero as GeneroPelicula] ?? genero.replace(/_/g, ' ').toLowerCase();
}

import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

/** Placeholder por defecto cuando una película no tiene póster cargado. */
export const DEFAULT_POSTER = 'assets/images/no-image.svg';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  /**
   * Convierte la ruta de imagen que devuelve el backend en una URL servible.
   * @param ruta ruta relativa (`/uploads/...`), URL absoluta o base64.
   * @param defaultImage imagen a mostrar cuando no hay ruta válida.
   */
  getImageUrl(ruta?: string, defaultImage: string = DEFAULT_POSTER): string {
    if (!ruta) return defaultImage;

    // URL absoluta (http/https) → se usa tal cual.
    if (ruta.startsWith('http://') || ruta.startsWith('https://')) {
      return ruta;
    }

    // Imagen embebida en base64.
    if (ruta.startsWith('data:')) {
      return ruta;
    }

    // Ruta servida por el backend (`/uploads/...`).
    if (ruta.startsWith('/uploads/') || ruta.startsWith('uploads/')) {
      const cleanPath = ruta.startsWith('/') ? ruta : `/${ruta}`;
      return `${environment.baseUrl}${cleanPath}`;
    }

    return defaultImage;
  }
}

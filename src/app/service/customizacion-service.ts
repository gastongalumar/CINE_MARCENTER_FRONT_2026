import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
// import { environment } from '../../environments/environment';
// import { Customizacion } from '../models/customizacion.model';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class CustomizacionService {
  private apiUrl = `${environment.apiUrl}/customizacion`;
  private temaSubject = new BehaviorSubject<Customizacion | null>(null);
  public tema$ = this.temaSubject.asObservable();

  constructor(private http: HttpClient,
              @Inject(DOCUMENT) private document: Document,
              @Inject(PLATFORM_ID) private platformId: Object) {}

  obtenerTema(): Observable<Customizacion> {
    return this.http.get<Customizacion>(this.apiUrl).pipe(
      tap(tema => this.actualizarTema(tema))
    );
  }

  guardarTema(customizacion: Customizacion): Observable<Customizacion> {
    return this.http.post<Customizacion>(this.apiUrl, customizacion).pipe(
      tap(tema => this.actualizarTema(tema))
    );
  }

  subirLogo(file: File): Observable<Customizacion> {
    const formData = new FormData();
    formData.append('logo', file);
    return this.http.post<any>(`${this.apiUrl}/logo`, formData).pipe(
      map(res => {
        if (res && res.logoUrl !== undefined) {
          return res as Customizacion;
        }
        const logoPath = res?.url || res?.ruta || '';
        const current = this.temaSubject.value || ({} as Customizacion);
        return { ...current, logoUrl: logoPath } as Customizacion;
      }),
      tap(tema => this.actualizarTema(tema))
    );
  }

  subirFondo(file: File): Observable<Customizacion> {
    const formData = new FormData();
    formData.append('fondo', file);
    return this.http.post<any>(`${this.apiUrl}/fondo`, formData).pipe(
      map(res => {
        if (res && res.fondoUrl !== undefined) {
          return res as Customizacion;
        }
        const fondoPath = res?.url || res?.ruta || '';
        const current = this.temaSubject.value || ({} as Customizacion);
        return { ...current, fondoUrl: fondoPath } as Customizacion;
      }),
      tap(tema => this.actualizarTema(tema))
    );
  }

  eliminarLogo(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/logo`);
  }

  eliminarFondo(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/fondo`);
  }

  private actualizarTema(tema: Customizacion): void {
    if (tema.logoUrl) tema.logoUrl = this.normalizeAssetUrl(tema.logoUrl);
    if (tema.fondoUrl) tema.fondoUrl = this.normalizeAssetUrl(tema.fondoUrl);
    this.temaSubject.next(tema);
    this.aplicarTema(tema);
  }

  aplicarTema(tema: Customizacion): void {
    // Avoid manipulating the DOM during server-side rendering
    if (!isPlatformBrowser(this.platformId)) return;

    const root = this.document.documentElement;
    // Normalizar opacidad: el backend guarda en 0-100, el CSS usa 0-1
    let globalOpacity = tema.globalOpacity ?? '1';
    const opacityNum = parseFloat(globalOpacity);
    if (opacityNum > 1) {
      globalOpacity = (opacityNum / 100).toString();
    }

    root.style.setProperty('--color-fondo', tema.colorFondo || '#ffffff');
    root.style.setProperty('--color-contenedor', tema.colorContenedor || '#ffffff');

    // Calcular color-contenedor-rgba combinando hex con globalOpacity
    const rgbContenedor = this.hexToRgb(tema.colorContenedor || '#0A6E61');
    if (rgbContenedor) {
      root.style.setProperty('--color-contenedor-rgba', `rgba(${rgbContenedor.r}, ${rgbContenedor.g}, ${rgbContenedor.b}, ${globalOpacity})`);
    }

    // Calcular color-fondo-rgba combinando colorFondo hex con globalOpacity
    const rgbFondo = this.hexToRgb(tema.colorFondo || '#0a0f1d');
    if (rgbFondo) {
      root.style.setProperty('--color-fondo-rgba', `rgba(${rgbFondo.r}, ${rgbFondo.g}, ${rgbFondo.b}, ${globalOpacity})`);
    }

    root.style.setProperty('--color-fuente', tema.colorFuente || '#000000');
    root.style.setProperty('--color-slider', tema.colorSlider || '#000000');
    root.style.setProperty('--tamano-fuente-titulos', tema.tamanoFuenteTitulos || '16px');
    root.style.setProperty('--tamano-fuente-texto', tema.tamanoFuenteTexto || '14px');
    if (tema.logoTamano) {
      root.style.setProperty('--logo-tamano', tema.logoTamano);
    }

    root.style.setProperty('--global-opacity', globalOpacity.toString());

    if (tema.logoOpacity) {
      root.style.setProperty('--logo-opacity', tema.logoOpacity);
    } else {
      root.style.setProperty('--logo-opacity', '1');
    }

    // Aplicar logo si existe
    if (tema.logoUrl) {
      const logoUrl = this.normalizeAssetUrl(tema.logoUrl);
      root.style.setProperty('--logo-url', `url('${logoUrl}')`);
    } else {
      root.style.removeProperty('--logo-url');
    }

    // Aplicar fondo si existe (imagen o video MP4/WEBM en loop)
    if (tema.fondoUrl) {
      const fondoUrl = this.normalizeAssetUrl(tema.fondoUrl);
      if (this.esVideo(fondoUrl)) {
        // Un video no puede ir como background-image: se monta un <video> fijo
        root.style.removeProperty('--fondo-url');
        this.montarFondoVideo(fondoUrl, rgbFondo, globalOpacity);
      } else {
        this.quitarFondoVideo();
        root.style.setProperty('--fondo-url', `url('${fondoUrl}')`);
        // Usar la imagen como fondo con el color semitransparente detrás
        this.document.body.style.backgroundImage = `url('${fondoUrl}')`;
        if (rgbFondo) {
          this.document.body.style.backgroundColor = `rgba(${rgbFondo.r}, ${rgbFondo.g}, ${rgbFondo.b}, ${globalOpacity})`;
        }
      }
    } else {
      root.style.removeProperty('--fondo-url');
      this.quitarFondoVideo();
      this.document.body.style.backgroundImage = '';
      if (rgbFondo) {
        this.document.body.style.backgroundColor = `rgba(${rgbFondo.r}, ${rgbFondo.g}, ${rgbFondo.b}, ${globalOpacity})`;
      }
    }
  }

  /** Indica si una URL corresponde a un video de fondo soportado. */
  esVideo(url?: string | null): boolean {
    if (!url) return false;
    const limpia = url.split(/[?#]/)[0].toLowerCase();
    return /\.(mp4|webm|ogv|ogg|mov|m4v)$/.test(limpia);
  }

  /**
   * Monta (o actualiza) el <video> de fondo global y su capa de color.
   * Ambos elementos van fijos, detrás del contenido de la app.
   */
  private montarFondoVideo(
    url: string,
    rgb: { r: number; g: number; b: number } | null,
    opacity: string
  ): void {
    const body = this.document.body;
    body.style.backgroundImage = '';
    body.style.backgroundColor = '#000';

    let video = this.document.getElementById('cinema-fondo-video') as HTMLVideoElement | null;
    if (!video) {
      video = this.document.createElement('video');
      video.id = 'cinema-fondo-video';
      video.className = 'cinema-fondo-video';
      video.muted = true;
      video.loop = true;
      video.autoplay = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.setAttribute('aria-hidden', 'true');
      video.setAttribute('tabindex', '-1');
      body.prepend(video);
    }

    if (video.getAttribute('src') !== url) {
      video.setAttribute('src', url);
      video.load();
    }

    const reproducir = () => {
      const p = video!.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          /* Autoplay bloqueado: el video queda con el primer frame */
        });
      }
    };
    reproducir();

    let overlay = this.document.getElementById('cinema-fondo-overlay');
    if (!overlay) {
      overlay = this.document.createElement('div');
      overlay.id = 'cinema-fondo-overlay';
      overlay.className = 'cinema-fondo-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      body.prepend(overlay);
    }
    overlay.style.background = rgb
      ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${this.opacidadVideo(opacity)})`
      : 'rgba(0, 0, 0, 0.4)';
  }

  /**
   * La capa de color sobre un video no puede ser 100% opaca, si no el video
   * quedaría oculto. Se limita la intensidad del tinte para que el fondo
   * animado siempre sea visible.
   */
  private opacidadVideo(opacity: string): number {
    const valor = parseFloat(opacity);
    const normalizado = isNaN(valor) ? 1 : valor;
    return Math.min(Math.max(normalizado, 0), 0.65);
  }

  /** Quita el video de fondo y su capa de color si estaban montados. */
  private quitarFondoVideo(): void {
    const video = this.document.getElementById('cinema-fondo-video') as HTMLVideoElement | null;
    if (video) {
      try {
        video.pause();
      } catch {
        /* ignorar */
      }
      video.remove();
    }
    const overlay = this.document.getElementById('cinema-fondo-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  private hexToRgb(hex: string): {r:number,g:number,b:number} | null {
    if (!hex) return null;
    let h = hex.replace('#', '');
    if (h.length === 3) {
      h = h.split('').map(c => c + c).join('');
    }
    if (h.length !== 6) return null;
    const r = parseInt(h.substring(0,2), 16);
    const g = parseInt(h.substring(2,4), 16);
    const b = parseInt(h.substring(4,6), 16);
    return {r,g,b};
  }

  private normalizeAssetUrl(path: string): string {
    if (!path) return '';
    const normalizedPath = path.trim().replace(/\\/g, '/');
    if (!normalizedPath) return '';
    if (/^(https?:|data:|blob:)/i.test(normalizedPath)) {
      return normalizedPath;
    }

    if (normalizedPath.startsWith('/uploads/') || normalizedPath.startsWith('uploads/')) {
      const apiBase = environment.apiUrl.replace(/\/api\/?$/, '');
      const uploadPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
      return `${apiBase}${encodeURI(uploadPath)}`;
    }

    if (normalizedPath.startsWith('/')) {
      return encodeURI(normalizedPath);
    }

    const assetPath = normalizedPath.startsWith('assets/')
      ? normalizedPath
      : `assets/${normalizedPath}`;
    return `/${encodeURI(assetPath)}`;
  }
}

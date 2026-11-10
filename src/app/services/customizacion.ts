import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Customizacion, EfectoFestivo } from '../models/customizacion';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { skipErrorToastContext } from '../utils/http.context';
import {
  optionsParaEfecto,
  optionsParaPreview,
  prefersReducedMotion,
} from '../effects/efecto-festivo.presets';
import type { Container, Engine } from '@tsparticles/engine';

const EFECTOS_FESTIVOS: EfectoFestivo[] = ['ninguno', 'navidad', 'halloween', 'ano-nuevo'];
const PARTICLES_GLOBAL_ID = 'cinema-efecto-particles';
const PARTICLES_PREVIEW_ID = 'cinema-efecto-particles-preview';

@Injectable({
  providedIn: 'root'
})
export class CustomizacionService {
  private apiUrl = `${environment.apiUrl}/customizacion`;
  private temaSubject = new BehaviorSubject<Customizacion | null>(null);
  public tema$ = this.temaSubject.asObservable();
  private efectoFestivoActual: EfectoFestivo = 'ninguno';
  private particlesEngine: Engine | null = null;
  private particlesInitPromise: Promise<Engine> | null = null;
  private particlesGlobal: Container | null = null;
  private particlesPreview: Container | null = null;

  constructor(private http: HttpClient,
              @Inject(DOCUMENT) private document: Document,
              @Inject(PLATFORM_ID) private platformId: Object) {}

  obtenerTema(): Observable<Customizacion> {
    return this.http.get<Customizacion>(this.apiUrl).pipe(
      tap(tema => this.actualizarTema(tema))
    );
  }

  guardarTema(customizacion: Customizacion): Observable<Customizacion> {
    return this.http
      .post<Customizacion>(this.apiUrl, customizacion, {
        context: skipErrorToastContext(),
      })
      .pipe(tap((tema) => this.actualizarTema(tema)));
  }

  subirLogo(file: File): Observable<Customizacion> {
    const formData = new FormData();
    formData.append('logo', file);
    return this.http.post<any>(`${this.apiUrl}/logo`, formData, {
      context: skipErrorToastContext(),
    }).pipe(
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
    return this.http.post<any>(`${this.apiUrl}/fondo`, formData, {
      context: skipErrorToastContext(),
    }).pipe(
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
    return this.http.delete(`${this.apiUrl}/logo`).pipe(
      tap(() => {
        const current = this.temaSubject.value;
        if (!current) return;
        const updated = { ...current, logoUrl: '' };
        this.temaSubject.next(updated);
        this.aplicarTema(updated);
      })
    );
  }

  eliminarFondo(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/fondo`).pipe(
      tap(() => {
        const current = this.temaSubject.value;
        if (!current) return;
        const updated = { ...current, fondoUrl: '' };
        this.temaSubject.next(updated);
        this.aplicarTema(updated);
      })
    );
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

    this.aplicarEfectoFestivo(tema.efectoFestivo);
  }

  /** Normaliza el valor del backend / UI a un preset válido. */
  normalizarEfectoFestivo(valor?: string | null): EfectoFestivo {
    if (valor && EFECTOS_FESTIVOS.includes(valor as EfectoFestivo)) {
      return valor as EfectoFestivo;
    }
    return 'ninguno';
  }

  private aplicarEfectoFestivo(valor?: string | null): void {
    const efecto = this.normalizarEfectoFestivo(valor);
    const root = this.document.documentElement;

    if (efecto === 'ninguno') {
      root.removeAttribute('data-efecto');
      void this.quitarEfectoFestivo();
      this.efectoFestivoActual = 'ninguno';
      return;
    }

    root.setAttribute('data-efecto', efecto);
    void this.montarEfectoFestivo(efecto);
    this.efectoFestivoActual = efecto;
  }

  /**
   * Overlay festivo (atmósfera + props + tsparticles).
   * Se recrea solo si cambia el preset.
   */
  private async montarEfectoFestivo(efecto: EfectoFestivo): Promise<void> {
    if (efecto === 'ninguno') {
      await this.quitarEfectoFestivo();
      return;
    }

    let capa = this.document.getElementById('cinema-efecto-festivo');
    if (!capa || this.efectoFestivoActual !== efecto) {
      await this.quitarEfectoFestivo();
      capa = this.crearCapaEfectoFestivo(efecto);
      this.document.body.appendChild(capa);
      await this.cargarParticlesGlobal(efecto);
    } else {
      capa.className = `cinema-efecto-festivo cinema-efecto-${efecto}`;
      capa.setAttribute('data-efecto', efecto);
    }
  }

  /** Construye el DOM de escena (sin spans de partículas; las pinta tsparticles). */
  private crearCapaEfectoFestivo(efecto: EfectoFestivo): HTMLDivElement {
    const capa = this.document.createElement('div');
    capa.id = 'cinema-efecto-festivo';
    capa.className = `cinema-efecto-festivo cinema-efecto-${efecto}`;
    capa.setAttribute('aria-hidden', 'true');
    capa.setAttribute('data-efecto', efecto);

    const atmosfera = this.document.createElement('div');
    atmosfera.className = 'efecto-atmosfera';
    capa.appendChild(atmosfera);

    const props = this.document.createElement('div');
    props.className = 'efecto-props';
    this.rellenarPropsEfecto(props, efecto);
    capa.appendChild(props);

    const particlesHost = this.document.createElement('div');
    particlesHost.id = PARTICLES_GLOBAL_ID;
    particlesHost.className = 'cinema-efecto-particles-host';
    capa.appendChild(particlesHost);

    return capa;
  }

  /** Preview local del panel tema (no aplica overlay global). */
  async montarPreviewEfectoFestivo(
    host: HTMLElement,
    efecto: EfectoFestivo
  ): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    await this.destruirParticlesPreview();
    if (efecto === 'ninguno' || prefersReducedMotion()) {
      return;
    }

    const engine = await this.ensureParticlesEngine();
    this.particlesPreview = (await engine.load({
      id: PARTICLES_PREVIEW_ID,
      element: host,
      options: optionsParaPreview(efecto),
    })) ?? null;
  }

  async quitarPreviewEfectoFestivo(): Promise<void> {
    await this.destruirParticlesPreview();
  }

  private async ensureParticlesEngine(): Promise<Engine> {
    if (this.particlesEngine) {
      return this.particlesEngine;
    }
    if (!this.particlesInitPromise) {
      this.particlesInitPromise = (async () => {
        const { tsParticles } = await import('@tsparticles/engine');
        const { loadSlim } = await import('@tsparticles/slim');
        const { loadEmittersPlugin } = await import('@tsparticles/plugin-emitters');
        const { loadWobbleUpdater } = await import('@tsparticles/updater-wobble');
        await loadSlim(tsParticles);
        await loadEmittersPlugin(tsParticles as never);
        await loadWobbleUpdater(tsParticles);
        this.particlesEngine = tsParticles;
        return tsParticles;
      })();
    }
    return this.particlesInitPromise;
  }

  private async cargarParticlesGlobal(efecto: EfectoFestivo): Promise<void> {
    if (efecto === 'ninguno' || prefersReducedMotion()) {
      return;
    }
    const host = this.document.getElementById(PARTICLES_GLOBAL_ID);
    if (!host) {
      return;
    }
    const engine = await this.ensureParticlesEngine();
    // fullScreen false: el canvas vive dentro del overlay fijo
    this.particlesGlobal = (await engine.load({
      id: PARTICLES_GLOBAL_ID,
      element: host,
      options: optionsParaEfecto(efecto, false),
    })) ?? null;
  }

  private async destruirParticlesGlobal(): Promise<void> {
    if (this.particlesGlobal) {
      this.particlesGlobal.destroy(true);
      this.particlesGlobal = null;
    }
  }

  private async destruirParticlesPreview(): Promise<void> {
    if (this.particlesPreview) {
      this.particlesPreview.destroy(true);
      this.particlesPreview = null;
    }
  }

  private rellenarPropsEfecto(props: HTMLElement, efecto: EfectoFestivo): void {
    if (efecto === 'navidad') {
      const guirnalda = this.document.createElement('div');
      guirnalda.className = 'efecto-prop efecto-guirnalda';
      for (let i = 0; i < 18; i++) {
        const luz = this.document.createElement('span');
        luz.className = `efecto-luz color-${i % 4}`;
        luz.style.setProperty('--i', String(i));
        guirnalda.appendChild(luz);
      }
      props.appendChild(guirnalda);
      return;
    }

    if (efecto === 'halloween') {
      ['tl', 'tr'].forEach((corner) => {
        const web = this.document.createElement('div');
        web.className = `efecto-prop efecto-telarana corner-${corner}`;
        props.appendChild(web);
      });
      const luna = this.document.createElement('div');
      luna.className = 'efecto-prop efecto-luna';
      props.appendChild(luna);
      return;
    }

    if (efecto === 'ano-nuevo') {
      for (let i = 0; i < 8; i++) {
        const spark = this.document.createElement('span');
        spark.className = `efecto-prop efecto-destello d-${i % 4}`;
        spark.style.setProperty('--i', String(i));
        spark.style.left = `${8 + i * 11}%`;
        spark.style.top = `${12 + ((i * 17) % 55)}%`;
        props.appendChild(spark);
      }
    }
  }

  private async quitarEfectoFestivo(): Promise<void> {
    await this.destruirParticlesGlobal();
    const capa = this.document.getElementById('cinema-efecto-festivo');
    if (capa) {
      capa.remove();
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

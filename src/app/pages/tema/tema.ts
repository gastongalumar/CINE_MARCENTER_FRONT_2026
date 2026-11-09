import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomizacionService } from '../../services/customizacion';
import { Customizacion } from '../../models/customizacion';
import { environment } from '../../../environments/environment';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { getErrorMessage } from '../../utils/api-error';
import { ConfirmDialogService } from '../../services/confirm-dialog';
import { refreshView } from '../../utils/refresh-view';

@Component({
  selector: 'app-tema',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './tema.html',
  styleUrls: ['../../styles/admin-panel.shared.css', './tema.css'],
})
export class TemaComponent implements OnInit {
  tema: any = {
    colorFondo: '#6E0A17',
    colorContenedor: '#0A6E61',
    colorFuente: '#FFFFFF',
    colorSlider: '#ffcc00',
    tamanoFuenteTitulos: '20px',
    tamanoFuenteTexto: '14px',
    tamanoFuenteTitulosPx: 20,
    tamanoFuenteTextoPx: 14,
    logoUrl: '',
    fondoUrl: '',
    logoTamano: '120px',
    logoTamanoPx: 120,
    logoOpacity: '1',
    logoOpacityPercent: 100,
    globalOpacity: '1',
    globalOpacityPercent: 100
  };

  guardando = false;
  fondoUrlValido = false;
  errorMensaje = '';

  constructor(
    private customizacionService: CustomizacionService,
    private toastr: ToastrService,
    private confirmDialog: ConfirmDialogService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarTema();
  }

  cargarTema(): void {
    this.customizacionService.obtenerTema().subscribe({
      next: (tema) => {
        this.tema = {
          ...tema,
          colorFondo: tema.colorFondo || '#6E0A17',
          colorContenedor: tema.colorContenedor || '#0A6E61',
          colorFuente: tema.colorFuente || '#FFFFFF',
          colorSlider: tema.colorSlider || '#ffcc00',
          tamanoFuenteTitulosPx: this.extraerNumero(tema.tamanoFuenteTitulos) || 20,
          tamanoFuenteTextoPx: this.extraerNumero(tema.tamanoFuenteTexto) || 14,
          logoTamanoPx: this.extraerNumero(tema.logoTamano || '120') || 120,
          logoUrl: tema.logoUrl || '',
          fondoUrl: tema.fondoUrl || '',
          logoOpacity: tema.logoOpacity || '1',
          logoOpacityPercent: tema.logoOpacity ? Math.round(parseFloat(tema.logoOpacity) * 100) : 100,
          // El backend almacena globalOpacity en escala 0-100, usarlo directamente para el slider
          globalOpacity: tema.globalOpacity ? (Math.round(parseFloat(tema.globalOpacity)) / 100).toString() : '1',
          globalOpacityPercent: tema.globalOpacity ? Math.round(parseFloat(tema.globalOpacity)) : 100
        };
        this.verificarFondoUrl();
        this.aplicarTemaGlobal();
        refreshView(this.cdr);
      },
      error: (error) => {
        console.error('Error al cargar tema:', error);
      }
    });
  }

  extraerNumero(valor: string): number {
    if (!valor) return 0;
    const match = valor.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }

  hexToRgbStr(hex: string): string {
    if (!hex) return '0,0,0';
    let h = hex.replace('#', '');
    if (h.length === 3) {
      h = h.split('').map(c => c + c).join('');
    }
    if (h.length !== 6) return '0,0,0';
    const r = parseInt(h.substring(0,2), 16);
    const g = parseInt(h.substring(2,4), 16);
    const b = parseInt(h.substring(4,6), 16);
    return `${r},${g},${b}`;
  }

  getAssetPath(ruta: string): string {
    if (!ruta) return '';

    // Si ya es URL completa
    if (ruta.startsWith('http://') || ruta.startsWith('https://')) {
      return ruta;
    }

    // Si es Base64
    if (ruta.startsWith('data:')) {
      return ruta;
    }

    // Si es ruta del servidor (/uploads/...)
    if (ruta.startsWith('/uploads/')) {
      const apiBase = environment.apiUrl.replace(/\/api\/?$/, '');
      return apiBase + encodeURI(ruta);
    }

    // Limpiar la ruta (reemplazar backslashes, eliminar espacios)
    let rutaLimpia = ruta.trim().replace(/\\/g, '/');

    // Si ya tiene assets/, devolver
    if (rutaLimpia.includes('assets/')) {
      // Asegurar que empiece con assets/
      const partes = rutaLimpia.split('assets/');
      return 'assets/' + partes[partes.length - 1];
    }

    // Si no, agregar assets/
    return 'assets/' + rutaLimpia;
  }

  verificarFondoUrl(): void {
    this.fondoUrlValido = !!this.tema.fondoUrl && this.tema.fondoUrl.trim() !== '';
  }

  /** Solo actualiza el estado local / panel de preview (no reestiliza toda la app). */
  onCampoCambiado(): void {
    this.verificarFondoUrl();
  }

  /** true si el fondo actual es un video (MP4/WEBM). */
  esVideoFondo(): boolean {
    return this.customizacionService.esVideo(this.tema?.fondoUrl);
  }

  /** Opacidad del tinte en la vista previa (limitada si hay video). */
  opacidadPreview(): number {
    const valor = parseFloat(this.tema?.globalOpacity);
    const normalizado = isNaN(valor) ? 1 : valor;
    return this.esVideoFondo() ? Math.min(normalizado, 0.65) : normalizado;
  }

  onImageLoad(event: any): void {
    if (event?.target) {
      event.target.style.display = '';
    }
  }

  onImageError(event: any): void {
    console.warn('Error al cargar imagen:', event.target.src);
    event.target.style.display = 'none';
  }

  onLogoSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Subir al backend
    this.customizacionService.subirLogo(file).subscribe({
      next: (tema) => {
        this.tema.logoUrl = tema.logoUrl || '';
        this.onCampoCambiado();
      },
      error: (err) => {
        console.error('Error al subir logo:', err);
        this.errorMensaje = getErrorMessage(err, 'No se pudo subir el logo.');
      }
    });
  }

  onFondoSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const esVideo = file.type === 'video/mp4' || file.type === 'video/webm';
    const esImagen = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp';
    if (!esVideo && !esImagen) {
      this.errorMensaje = 'Formato no permitido. Usá JPG, PNG, WEBP, MP4 o WEBM.';
      event.target.value = '';
      return;
    }

    const maxBytes = esVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      this.errorMensaje = esVideo
        ? 'El video supera el tamaño máximo permitido (50 MB).'
        : 'La imagen supera el tamaño máximo permitido (5 MB).';
      event.target.value = '';
      return;
    }

    this.errorMensaje = '';
    this.customizacionService.subirFondo(file).subscribe({
      next: (tema) => {
        this.tema.fondoUrl = tema.fondoUrl || '';
        this.verificarFondoUrl();
        refreshView(this.cdr);
        this.toastr.success(esVideo ? 'Video de fondo subido' : 'Imagen de fondo subida', 'Éxito');
      },
      error: (err) => {
        console.error('Error al subir fondo:', err);
        this.errorMensaje = getErrorMessage(err, 'No se pudo subir el fondo.');
        refreshView(this.cdr);
      }
    });

    // Permite volver a elegir el mismo archivo
    event.target.value = '';
  }

  eliminarLogo(): void {
    this.confirmDialog
      .confirmDanger('Eliminar logo', '¿Querés quitar el logo actual del encabezado?')
      .subscribe((confirmado) => {
        if (!confirmado) return;

        this.customizacionService.eliminarLogo().subscribe({
          next: () => {
            this.tema.logoUrl = '';
            this.aplicarTemaGlobal();
            this.toastr.success('Logo eliminado', 'Éxito');
          },
          error: (err) => {
            console.error('Error al eliminar logo:', err);
          }
        });
      });
  }

  eliminarFondo(): void {
    this.confirmDialog
      .confirmDanger('Eliminar fondo', '¿Querés quitar la imagen de fondo actual?')
      .subscribe((confirmado) => {
        if (!confirmado) return;

        this.customizacionService.eliminarFondo().subscribe({
          next: () => {
            this.tema.fondoUrl = '';
            this.verificarFondoUrl();
            this.aplicarTemaGlobal();
            refreshView(this.cdr);
            this.toastr.success('Fondo eliminado', 'Éxito');
          },
          error: (err) => {
            console.error('Error al eliminar fondo:', err);
          }
        });
      });
  }

  actualizarGlobalOpacity(): void {
    this.tema.globalOpacity = (this.tema.globalOpacityPercent / 100).toString();
    this.onCampoCambiado();
  }

  /** Aplica el tema actual a toda la app (cargar / guardar / cancelar / eliminar). */
  private construirTemaActual(): Customizacion {
    return {
      colorFondo: this.tema.colorFondo,
      colorContenedor: this.tema.colorContenedor,
      colorFuente: this.tema.colorFuente,
      colorSlider: this.tema.colorSlider,
      tamanoFuenteTitulos: this.tema.tamanoFuenteTitulos,
      tamanoFuenteTexto: this.tema.tamanoFuenteTexto,
      logoUrl: this.tema.logoUrl,
      fondoUrl: this.tema.fondoUrl,
      logoTamano: this.tema.logoTamano,
      logoOpacity: this.tema.logoOpacity,
      globalOpacity: this.tema.globalOpacity
    };
  }

  private aplicarTemaGlobal(): void {
    this.verificarFondoUrl();
    this.customizacionService.aplicarTema(this.construirTemaActual());
  }

  actualizarTitulos(): void {
    this.tema.tamanoFuenteTitulos = this.tema.tamanoFuenteTitulosPx + 'px';
    this.onCampoCambiado();
  }

  actualizarTexto(): void {
    this.tema.tamanoFuenteTexto = this.tema.tamanoFuenteTextoPx + 'px';
    this.onCampoCambiado();
  }

  actualizarLogoTamano(): void {
    this.tema.logoTamano = this.tema.logoTamanoPx + 'px';
    this.onCampoCambiado();
  }

  actualizarLogoOpacity(): void {
    // Convertir percent a string entre 0 y 1
    this.tema.logoOpacity = (this.tema.logoOpacityPercent / 100).toString();
    this.onCampoCambiado();
  }

  guardarTema(): void {
    this.guardando = true;
    this.errorMensaje = '';

    const temaGuardar: Customizacion = {
      ...this.construirTemaActual(),
      // El backend espera globalOpacity como un número entre 0 y 100
      globalOpacity: String(this.tema.globalOpacityPercent)
    };

    this.customizacionService.guardarTema(temaGuardar).subscribe({
      next: () => {
        this.guardando = false;
        this.toastr.success('Tema guardado correctamente', 'Éxito');
      },
      error: (err: unknown) => {
        console.error('Error al guardar tema:', err);
        this.errorMensaje = getErrorMessage(err);
        this.guardando = false;
      }
    });
  }

  cancelar(): void {
    this.cargarTema();
  }
}

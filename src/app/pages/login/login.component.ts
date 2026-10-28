import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../models/auth.model';
import { CustomizacionService } from '../../services/customizacion.service';
import { Customizacion } from '../../models/customizacion.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  credentials: LoginRequest = {
    email: '',
    password: ''
  };
  loading = false;
  loginError = '';

  // Preview controls
  logoUrl: string = '';
  logoSizePx: number = 120;
  logoOpacityPercent: number = 100; // 0-100
  temaActual: Customizacion | null = null;

  returnUrl: string = '/cartelera';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private customizacionService: CustomizacionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/cartelera';

    if (this.route.snapshot.queryParamMap.get('error') === 'google') {
      this.loginError = 'No se pudo iniciar sesión con Google. Intentá de nuevo.';
    }

    if (this.authService.isAuthenticated()) {
      this.router.navigateByUrl(this.returnUrl);
      return;
    }

    // Cargar tema para vista previa
    this.customizacionService.obtenerTema().subscribe({
      next: (tema) => {
        this.temaActual = tema;
        if (tema.logoUrl) {
          this.logoUrl = tema.logoUrl;
        }
        // extraer tamanio si existe
        if (tema.logoTamano) {
          const m = tema.logoTamano.match(/(\d+)/);
          if (m) this.logoSizePx = parseInt(m[0], 10);
        }
        // extraer opacidad si existe (valor entre '0' y '1')
        if (tema.logoOpacity) {
          const val = parseFloat(tema.logoOpacity);
          if (!isNaN(val)) this.logoOpacityPercent = Math.round(val * 100);
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.warn('No se pudo cargar tema para preview:', err);
      }
    });
  }

  aplicarPreviewGlobal(): void {
    // Aplica logoTamano en variables root usando el servicio
    const temaPreview: Customizacion = {
      colorFondo: this.temaActual?.colorFondo || '#6E0A17',
      colorContenedor: this.temaActual?.colorContenedor || '#0A6E61',
      colorFuente: this.temaActual?.colorFuente || '#FFFFFF',
      colorSlider: this.temaActual?.colorSlider || '#ffcc00',
      tamanoFuenteTitulos: this.temaActual?.tamanoFuenteTitulos || '20px',
      tamanoFuenteTexto: this.temaActual?.tamanoFuenteTexto || '14px',
      logoUrl: this.logoUrl,
      fondoUrl: this.temaActual?.fondoUrl || '',
      logoTamano: this.logoSizePx + 'px',
      logoOpacity: (this.logoOpacityPercent / 100).toString(),
      globalOpacity: this.temaActual?.globalOpacity
    };
    this.customizacionService.aplicarTema(temaPreview);
  }

  /** Redirige al endpoint de Spring Security que inicia el flujo con Google. */
  continuarConGoogle(): void {
    window.location.href = `${environment.baseUrl}/oauth2/authorization/google`;
  }

  onSubmit(): void {
    this.loading = true;
    this.loginError = '';
    this.cdr.markForCheck();
    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        this.loading = false;
        this.cdr.markForCheck();
        if (response.tipo === 'ADMINISTRADOR') {
          this.router.navigate(['/admin']);
        } else {
          // Redirigir a returnUrl si existe (ej: compra de entradas), o a cartelera
          this.router.navigateByUrl(this.returnUrl);
        }
      },
      error: (error) => {
        this.loading = false;
        this.loginError = error?.message || 'No se pudo iniciar sesión.';
        this.cdr.markForCheck();
        console.error('Login error:', error);
      }
    });
  }
}
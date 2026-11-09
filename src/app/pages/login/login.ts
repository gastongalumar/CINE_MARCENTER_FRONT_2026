import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CustomizacionService } from '../../services/customizacion';
import { Customizacion } from '../../models/customizacion';
import { environment } from '../../../environments/environment';
import { autorizarButacas, peliculaIdDesdeButacasUrl } from '../../utils/butacas-access';
import { esControlInvalido } from '../../utils/form-error';
import { getErrorMessage } from '../../utils/api-error';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  loading = false;
  loginError = '';
  loginSuccess = '';
  mostrarPassword = false;

  logoUrl: string = '';
  logoSizePx: number = 120;
  logoOpacityPercent: number = 100;
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

    if (this.route.snapshot.queryParamMap.get('reset') === 'true') {
      this.loginSuccess = 'Contraseña actualizada. Ya podés iniciar sesión.';
    }

    if (this.authService.isAuthenticated()) {
      this.autorizarSiReturnButacas();
      this.router.navigateByUrl(this.returnUrl);
      return;
    }

    this.customizacionService.obtenerTema().subscribe({
      next: (tema) => {
        this.temaActual = tema;
        if (tema.logoUrl) {
          this.logoUrl = tema.logoUrl;
        }
        if (tema.logoTamano) {
          const m = tema.logoTamano.match(/(\d+)/);
          if (m) this.logoSizePx = parseInt(m[0], 10);
        }
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

  esInvalido(campo: string): boolean {
    return esControlInvalido(this.form.get(campo));
  }

  onCampoBlur(): void {
    this.cdr.markForCheck();
  }

  alternarPassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
    this.cdr.markForCheck();
  }

  aplicarPreviewGlobal(): void {
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

  continuarConGoogle(): void {
    window.location.href = `${environment.baseUrl}/oauth2/authorization/google`;
  }

  private autorizarSiReturnButacas(): void {
    const peliculaId = peliculaIdDesdeButacasUrl(this.returnUrl);
    if (peliculaId != null) {
      autorizarButacas(peliculaId);
    }
  }

  onSubmit(): void {
    this.loginError = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    const credentials = this.form.getRawValue();
    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.loading = false;
        this.cdr.markForCheck();
        if (response.tipo === 'ADMINISTRADOR' || response.tipo === 'SUPERADMIN') {
          this.router.navigate(['/admin']);
        } else {
          this.autorizarSiReturnButacas();
          this.router.navigateByUrl(this.returnUrl);
        }
      },
      error: (error: unknown) => {
        this.loading = false;
        this.loginError = getErrorMessage(error, 'No se pudo iniciar sesión.');
        this.cdr.markForCheck();
      }
    });
  }
}

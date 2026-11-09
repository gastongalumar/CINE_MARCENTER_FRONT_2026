import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TOKEN_STORAGE_KEY } from '../../services/auth';
import { decodeJwtPayload, isJwtExpired } from '../../utils/jwt';

/**
 * Destino del redirect de OAuth2.
 *
 * El backend (OAuth2AuthenticationSuccessHandler) llega acá con el JWT propio
 * en el query param `token`. Se guarda en sessionStorage con la misma clave que
 * usa el login tradicional y se recarga la aplicación para que `AuthService`
 * restaure la sesión desde el almacenamiento. Así el interceptor y los guards
 * siguen funcionando sin cambios.
 */
@Component({
  selector: 'app-oauth2-redirect',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './oauth2-redirect.html',
  styleUrls: ['./oauth2-redirect.css'],
})
export class OAuth2RedirectComponent implements OnInit {

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token || isJwtExpired(token)) {
      this.irAlLogin();
      return;
    }

    try {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
      this.irAlLogin();
      return;
    }

    const claims = decodeJwtPayload(token);
    const destino = claims?.tipo === 'ADMINISTRADOR' ? '/admin' : '/cartelera';

    // Quita el token de la barra de direcciones antes de recargar.
    window.history.replaceState({}, '', '/oauth2/redirect');
    // Recarga completa: AuthService se inicializa leyendo el token guardado.
    window.location.replace(destino);
  }

  private irAlLogin(): void {
    try {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // localStorage puede no estar disponible: se ignora.
    }
    this.router.navigate(['/login'], { queryParams: { error: 'google' } });
  }
}

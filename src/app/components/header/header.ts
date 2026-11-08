import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CustomizacionService } from '../../services/customizacion';
import { ImageService } from '../../services/image';
import { Observable } from 'rxjs';
import type { Customizacion } from '../../models/customizacion';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
})
export class HeaderComponent implements OnInit {
  private readonly imageService = inject(ImageService);

  tema$: Observable<Customizacion | null>;
  isLightTheme = false;
  logoUnavailable = false;

  /** URL absoluta de la foto de perfil, o null. */
  readonly fotoPerfilUrl = computed(() => {
    const ruta = this.authService.currentUser()?.fotoPerfilUrl;
    if (!ruta) return null;
    const url = this.imageService.getImageUrl(ruta, '');
    return url || null;
  });

  constructor(
    public authService: AuthService,  // Cambiado a public para usar en template
    private customizacionService: CustomizacionService,
    private router: Router
  ) {
    this.tema$ = this.customizacionService.tema$;
  }

  ngOnInit(): void {
    this.tema$.subscribe(tema => {
      if (tema?.logoUrl) {
        this.logoUnavailable = false;
      }
    });
    this.customizacionService.obtenerTema().subscribe();
    // Inicializar tema desde localStorage
    try {
      const t = localStorage.getItem('app-theme');
      if (t === 'light') {
        document.body.classList.add('light-theme');
        this.isLightTheme = true;
      }
    } catch (e) { /* no bloquear si hay error */ }
  }

  onLogoError(): void {
    this.logoUnavailable = true;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/cartelera']);
  }

  toggleTheme(): void {
    try {
      this.isLightTheme = !this.isLightTheme;
      if (this.isLightTheme) {
        document.body.classList.add('light-theme');
        localStorage.setItem('app-theme', 'light');
      } else {
        document.body.classList.remove('light-theme');
        localStorage.setItem('app-theme', 'dark');
      }
    } catch (e) {
      console.warn('toggleTheme error', e);
    }
  }
}

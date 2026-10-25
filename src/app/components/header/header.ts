import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CustomizacionService } from '../../services/customizacion.service';
import { Observable, map } from 'rxjs';
import { Customizacion } from '../../models/customizacion.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
})
export class HeaderComponent implements OnInit {
  tema$: Observable<Customizacion | null>;
  isLightTheme = false;
  logoUnavailable = false;

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

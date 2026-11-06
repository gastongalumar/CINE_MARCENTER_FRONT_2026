import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { CustomizacionService } from '../../../core/services/customizacion';
import { Observable, map } from 'rxjs';
import { Customizacion } from '../../../core/models/customizacion';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark">
      <div class="container">
        <a class="navbar-brand d-flex align-items-center" routerLink="/cartelera">
          <ng-container *ngIf="(tema$ | async)?.logoUrl; else brandText">
            <img [src]="(tema$ | async)?.logoUrl || ''" alt="Logo" class="app-logo">
          </ng-container>
          <ng-template #brandText>
            <span class="brand-text">CineApp</span>
          </ng-template>
        </a>

        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <a class="nav-link" routerLink="/cartelera" routerLinkActive="active">Cartelera</a>
            </li>

            <ng-container *ngIf="authService.isAuthenticated() && authService.getTipoUsuario() !== 'ADMINISTRADOR'">
              <li class="nav-item">
                <a class="nav-link" routerLink="/mis-compras" routerLinkActive="active">Mis Compras</a>
              </li>
            </ng-container>
            <ng-container *ngIf="authService.isAuthenticated()">
              <li class="nav-item">
                <a class="nav-link" routerLink="/perfil" routerLinkActive="active">Perfil</a>
              </li>
            </ng-container>

            <ng-container *ngIf="authService.getTipoUsuario() === 'ADMINISTRADOR'">
              <li class="nav-item dropdown admin-nav-dropdown">
                <a class="nav-link dropdown-toggle admin-nav-toggle" href="#" role="button"
                   data-bs-toggle="dropdown" aria-expanded="false">
                  <span class="material-icons admin-nav-icon">admin_panel_settings</span>
                  Administración
                </a>
                <ul class="dropdown-menu admin-dropdown-menu shadow-lg">
                  <li class="dropdown-header admin-dropdown-title">
                    <span class="material-icons">dashboard</span>
                    Panel de administración
                  </li>
                  <li>
                    <a class="dropdown-item admin-dropdown-item" routerLink="/admin" routerLinkActive="active">
                      <span class="material-icons">home</span>
                      <span>Dashboard</span>
                    </a>
                  </li>
                  <li><hr class="dropdown-divider admin-dropdown-divider"></li>
                  <li class="dropdown-header admin-dropdown-section">Gestión</li>
                  <li>
                    <a class="dropdown-item admin-dropdown-item" routerLink="/admin/peliculas" routerLinkActive="active">
                      <span class="material-icons">movie</span>
                      <span>Películas</span>
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item admin-dropdown-item" routerLink="/admin/funciones" routerLinkActive="active">
                      <span class="material-icons">schedule</span>
                      <span>Funciones</span>
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item admin-dropdown-item" routerLink="/admin/salas" routerLinkActive="active">
                      <span class="material-icons">meeting_room</span>
                      <span>Salas</span>
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item admin-dropdown-item" routerLink="/admin/usuarios" routerLinkActive="active">
                      <span class="material-icons">group</span>
                      <span>Usuarios</span>
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item admin-dropdown-item" routerLink="/admin/validar-ticket" routerLinkActive="active">
                      <span class="material-icons">confirmation_number</span>
                      <span>Validar Ticket</span>
                    </a>
                  </li>
                  <li><hr class="dropdown-divider admin-dropdown-divider"></li>
                  <li class="dropdown-header admin-dropdown-section">Sistema</li>
                  <li>
                    <a class="dropdown-item admin-dropdown-item" routerLink="/admin/tema" routerLinkActive="active">
                      <span class="material-icons">palette</span>
                      <span>Personalizar Tema</span>
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item admin-dropdown-item" routerLink="/admin/crear-admin" routerLinkActive="active">
                      <span class="material-icons">person_add</span>
                      <span>Crear Admin</span>
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item admin-dropdown-item" routerLink="/admin/estadisticas" routerLinkActive="active">
                      <span class="material-icons">analytics</span>
                      <span>Estadísticas</span>
                    </a>
                  </li>
                </ul>
              </li>
            </ng-container>
          </ul>

          <ul class="navbar-nav align-items-center">
            <li class="nav-item me-2">
              <button class="theme-toggle btn" (click)="toggleTheme()" title="Cambiar tema">
                <span *ngIf="isLightTheme" class="material-icons">light_mode</span>
                <span *ngIf="!isLightTheme" class="material-icons">dark_mode</span>
              </button>
            </li>
            <ng-container *ngIf="authService.isAuthenticated(); else loginBlock">
              <li class="nav-item me-2">
                <span class="nav-link user-greet">Hola, {{ (authService.getCurrentUser()?.nombre || '').split(' ')[0] }}</span>
              </li>
              <li class="nav-item">
                <button class="btn btn-outline-light btn-sm" (click)="logout()">Cerrar Sesión</button>
              </li>
            </ng-container>
            <ng-template #loginBlock>
              <li class="nav-item me-2">
                <a class="nav-link" routerLink="/login">Iniciar Sesión</a>
              </li>
              <li class="nav-item">
                <a class="btn btn-primary btn-sm" routerLink="/registro">Registrarse</a>
              </li>
            </ng-template>
          </ul>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    /* Header specific styles */
    .app-logo { height: 44px; width: auto; border-radius: 6px; margin-right: 10px; }
    .brand-text { font-weight: 700; font-size: 1.1rem; color: var(--color-fuente); }
    .navbar { background-color: var(--color-contenedor) !important; }
    .nav-link { color: var(--color-fuente) !important; }
    .user-greet { color: var(--color-fuente); }
    .btn-primary { background-color: var(--color-slider); border-color: var(--color-slider); color: #000; }
    .btn-outline-light { border-color: rgba(255,255,255,0.2); color: var(--color-fuente); }
    .theme-toggle { background: transparent; border: 1px solid rgba(255,255,255,0.04); color: var(--color-fuente); }

    /* Admin dropdown */
    .admin-nav-toggle {
      display: inline-flex !important;
      align-items: center;
      gap: 0.35rem;
      font-weight: 600;
    }
    .admin-nav-icon {
      font-size: 1.15rem;
      color: var(--color-slider);
    }
    .admin-dropdown-menu {
      min-width: 260px;
      padding: 0.5rem 0;
      margin-top: 0.65rem !important;
      background: rgba(12, 18, 32, 0.96) !important;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      border-radius: var(--border-radius-md);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45) !important;
    }
    :host-context(.light-theme) .admin-dropdown-menu {
      background: rgba(255, 255, 255, 0.98) !important;
      border-color: rgba(0, 0, 0, 0.08) !important;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12) !important;
    }
    .admin-dropdown-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--color-slider) !important;
      padding: 0.65rem 1rem 0.45rem;
    }
    .admin-dropdown-title .material-icons {
      font-size: 1.1rem;
    }
    .admin-dropdown-section {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--color-muted) !important;
      padding: 0.35rem 1rem 0.25rem;
    }
    .admin-dropdown-divider {
      margin: 0.35rem 0.75rem;
      border-color: rgba(255, 255, 255, 0.1);
      opacity: 1;
    }
    :host-context(.light-theme) .admin-dropdown-divider {
      border-color: rgba(0, 0, 0, 0.08);
    }
    .admin-dropdown-item {
      display: flex !important;
      align-items: center;
      gap: 0.65rem;
      padding: 0.55rem 1rem !important;
      font-size: 0.9rem;
      color: var(--color-fuente) !important;
      transition: background 0.15s, color 0.15s, padding-left 0.15s;
    }
    .admin-dropdown-item .material-icons {
      font-size: 1.15rem;
      color: var(--color-muted);
      transition: color 0.15s;
    }
    .admin-dropdown-item:hover,
    .admin-dropdown-item:focus {
      background: rgba(245, 197, 24, 0.1) !important;
      color: var(--color-fuente) !important;
    }
    .admin-dropdown-item:hover .material-icons,
    .admin-dropdown-item.active .material-icons {
      color: var(--color-slider);
    }
    .admin-dropdown-item.active {
      background: rgba(245, 197, 24, 0.14) !important;
      font-weight: 600;
    }
    :host-context(.light-theme) .admin-dropdown-item:hover,
    :host-context(.light-theme) .admin-dropdown-item.active {
      background: rgba(26, 35, 126, 0.08) !important;
    }
    :host-context(.light-theme) .admin-dropdown-item:hover .material-icons,
    :host-context(.light-theme) .admin-dropdown-item.active .material-icons {
      color: var(--color-slider);
    }
  `]
})
export class HeaderComponent implements OnInit {
  tema$: Observable<Customizacion | null>;
  isLightTheme = false;

  constructor(
    public authService: AuthService,  // Cambiado a public para usar en template
    private customizacionService: CustomizacionService,
    private router: Router
  ) {
    this.tema$ = this.customizacionService.tema$;
  }

  ngOnInit(): void {
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

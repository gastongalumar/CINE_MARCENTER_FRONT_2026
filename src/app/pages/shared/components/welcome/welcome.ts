import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CustomizacionService } from '../../../core/services/customizacion';
import { Customizacion } from '../../../core/models/customizacion';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="welcome-wrapper d-flex align-items-center justify-content-center"
         [style.backgroundImage]="tema?.fondoUrl ? 'url(' + tema!.fondoUrl + ')' : 'none'"
         style="flex-direction:column; background-size:cover; background-position:center; background-repeat:no-repeat;">

      <!-- Overlay oscuro cinemático para legibilidad -->
      <div class="welcome-overlay"></div>

      <!-- Contenido centrado -->
      <div class="welcome-card text-center">

        <!-- Logo dinámico o fallback de texto -->
        <div class="logo-container mb-4">
          <img
            *ngIf="logoUrl"
            [src]="logoUrl"
            alt="Logo del cine"
            class="welcome-logo"
            (error)="onLogoError()"
          />
          <div *ngIf="!logoUrl" class="logo-fallback">
            <span class="material-icons splash-movie-icon">movie</span>
          </div>
        </div>

        <h1 class="welcome-title">{{ tema?.nombreCine || 'Cinemacenter' }}</h1>
        <p class="welcome-sub">Disfruta de las mejores producciones en pantalla grande</p>

        <div class="d-flex flex-column flex-sm-row gap-3 justify-content-center mt-4 pt-2">
          <button class="btn btn-primary btn-lg px-5 btn-welcome" (click)="goRegistro()">
            Registrarse <span class="material-icons font-icon-sm">person_add</span>
          </button>
          <button class="btn btn-outline-light btn-lg px-4 btn-welcome" (click)="goLogin()">
            Iniciar sesión <span class="material-icons font-icon-sm">login</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .welcome-wrapper { 
      position: relative; 
      background-color: #05070f; 
      width: 100%;
      height: 75vh;
      min-height: 580px;
      border-radius: var(--border-radius-lg);
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.05);
      box-shadow: var(--shadow-premium);
    }
    .welcome-overlay {
      position: absolute; 
      inset: 0;
      background: radial-gradient(circle at center, rgba(15, 23, 42, 0.4) 0%, rgba(5, 7, 15, 0.88) 100%);
      z-index: 0;
    }
    .welcome-card {
      position: relative; 
      z-index: 1;
      padding: 3.5rem 3rem;
      background: rgba(10, 15, 29, 0.45);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
      color: white;
      max-width: 520px;
      width: 90%;
      animation: welcomeCardEntrance 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes welcomeCardEntrance {
      from { opacity: 0; transform: scale(0.95) translateY(20px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .logo-container { 
      min-height: 100px; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
    }
    .welcome-logo {
      max-height: 120px;
      max-width: 240px;
      object-fit: contain;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      animation: logoGlow 4s infinite alternate;
    }
    @keyframes logoGlow {
      from { box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
      to { box-shadow: 0 10px 30px rgba(245, 197, 24, 0.25); }
    }
    .logo-fallback { 
      background: rgba(255, 255, 255, 0.04);
      border: 1.5px solid rgba(255, 255, 255, 0.08);
      width: 90px;
      height: 90px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    }
    .splash-movie-icon {
      font-size: 3rem;
      color: var(--color-slider, #f5c518);
    }
    .welcome-title { 
      font-size: 2.5rem; 
      font-weight: 800; 
      color: white; 
      margin-bottom: 0.5rem; 
      letter-spacing: -0.03em;
    }
    .welcome-sub { 
      color: rgba(255, 255, 255, 0.75); 
      font-size: 1.1rem; 
      font-weight: 400;
      line-height: 1.5;
    }
    .btn-welcome {
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .btn-primary { 
      background: linear-gradient(135deg, var(--color-slider, #f5c518), color-mix(in srgb, var(--color-slider, #f5c518) 80%, #000)) !important; 
      border: none !important; 
      color: #000 !important; 
      font-weight: 700; 
    }
    .btn-outline-light { 
      border: 1px solid rgba(255, 255, 255, 0.2) !important; 
      color: white !important; 
      background-color: rgba(255, 255, 255, 0.03) !important;
      backdrop-filter: blur(4px);
    }
    .btn-outline-light:hover { 
      background-color: white !important; 
      color: #05070f !important; 
    }
    .font-icon-sm {
      font-size: 1.15rem;
      vertical-align: middle;
    }
    @media (max-width: 576px) {
      .welcome-card {
        padding: 2.5rem 1.5rem;
      }
      .welcome-title {
        font-size: 2rem;
      }
    }
  `]
})
export class WelcomeComponent implements OnInit {
  tema: Customizacion | null = null;
  logoUrl: string | null = null;

  constructor(
    private router: Router,
    private customizacionService: CustomizacionService
  ) {}

  ngOnInit(): void {
    // Suscribirse al tema observable (BehaviorSubject emite el valor actual inmediatamente)
    this.customizacionService.tema$.subscribe(tema => {
      if (tema) {
        this.tema = tema;
        this.logoUrl = tema.logoUrl || null;
      }
    });

    // Disparar carga si el tema no fue cargado previamente (tema$ emitirá null)
    this.customizacionService.obtenerTema().subscribe({
      next: (tema) => {
        this.tema = tema;
        this.logoUrl = tema.logoUrl || null;
      },
      error: () => { /* sin tema, el fallback emoji se muestra */ }
    });
  }

  onLogoError(): void {
    this.logoUrl = null;
  }

  goRegistro(): void {
    this.router.navigate(['/registro']);
  }

  goLogin(): void {
    this.router.navigate(['/login']);
  }
}

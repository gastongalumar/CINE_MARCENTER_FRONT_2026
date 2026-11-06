import { Component, HostBinding, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomizacionService } from '../../../core/services/customizacion';

@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="splash-card" role="status" aria-live="polite">
      <img
        *ngIf="logoUrl; else iconFallback"
        [src]="logoUrl"
        alt="Logo"
        class="splash-logo"
        (error)="logoUrl = null"
      />
      <ng-template #iconFallback>
        <div class="splash-icon"><span class="material-icons">movie</span></div>
      </ng-template>
      <h1 class="splash-title">{{ nombreCine }}</h1>
      <p class="splash-sub">Cargando cartelera, por favor espere...</p>
      <div class="splash-spinner">
        <div class="spinner-border" role="status"><span class="visually-hidden">Cargando...</span></div>
      </div>
    </div>
  `,
  styles: [
    `
    :host { display: flex; position: fixed; inset: 0; opacity: 0; pointer-events: none; transition: opacity 320ms ease; z-index: 1050; align-items:center; justify-content:center; }
    :host(.show) { opacity: 1; pointer-events: auto; }
    :host { background: linear-gradient(180deg, rgba(0,0,0,0.6), rgba(0,0,0,0.85)); }
    .splash-card { text-align: center; padding: 2rem 3rem; border-radius: 12px; background: rgba(10,10,10,0.45); backdrop-filter: blur(6px); box-shadow: 0 10px 30px rgba(0,0,0,0.6); }
    .splash-logo { width: 140px; max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 1rem; object-fit: contain; box-shadow: 0 6px 18px rgba(0,0,0,0.5); }
    .splash-icon { font-size: 4rem; margin-bottom: 1rem; }
    .splash-title { color: var(--color-fuente, #fff); margin-bottom: 0.25rem; font-size: 1.6rem; }
    .splash-sub { color: rgba(255,255,255,0.85); margin-bottom: 1rem; }
    .splash-spinner .spinner-border { color: var(--color-slider, #f5c518); width: 3rem; height: 3rem; }
    `
  ]
})
export class SplashComponent implements OnInit {
  // Allow parent to set the "show" class on the host element via [class.show]
  @HostBinding('class.show') hostShow = false;

  logoUrl: string | null = null;
  nombreCine: string = 'Bienvenido a Cine';

  constructor(private customizacionService: CustomizacionService) {}

  ngOnInit(): void {
    this.customizacionService.tema$.subscribe(tema => {
      if (tema) {
        this.logoUrl = tema.logoUrl || null;
        this.nombreCine = tema.nombreCine || 'Bienvenido a Cine';
      }
    });
  }
}

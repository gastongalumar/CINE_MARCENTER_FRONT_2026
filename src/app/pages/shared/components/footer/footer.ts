import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="footer mt-5 py-4">
      <div class="container d-flex flex-column flex-md-row justify-content-between align-items-center">
        <div class="mb-2 mb-md-0 text-muted small">&copy; 2026 CineApp - Todos los derechos reservados</div>
        <div class="d-flex gap-3 align-items-center">
          <a href="#" class="text-muted small">Términos</a>
          <a href="#" class="text-muted small">Privacidad</a>
          <span class="text-muted small">📞 Soporte: soporte@cineapp.local</span>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer { position: relative; bottom: 0; width: 100%; background: transparent; border-top: 1px solid rgba(255,255,255,0.03); }
    .footer a { color: var(--color-muted); text-decoration: none; }
    .footer a:hover { color: var(--color-fuente); }
  `]
})
export class FooterComponent {}

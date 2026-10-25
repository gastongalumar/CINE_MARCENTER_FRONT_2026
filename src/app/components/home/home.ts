import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CustomizacionService } from '../../services/customizacion.service';
import { Customizacion } from '../../models/customizacion.model';
import { refreshView } from '../../utils/refresh-view.util';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class WelcomeComponent implements OnInit {
  tema: Customizacion | null = null;
  logoUrl: string | null = null;

  constructor(
    private router: Router,
    private customizacionService: CustomizacionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Suscribirse al tema observable (BehaviorSubject emite el valor actual inmediatamente)
    this.customizacionService.tema$.subscribe(tema => {
      if (tema) {
        this.tema = tema;
        this.logoUrl = tema.logoUrl || null;
        refreshView(this.cdr);
      }
    });

    // Disparar carga si el tema no fue cargado previamente (tema$ emitirá null)
    this.customizacionService.obtenerTema().subscribe({
      next: (tema) => {
        this.tema = tema;
        this.logoUrl = tema.logoUrl || null;
        refreshView(this.cdr);
      },
      error: () => { /* sin tema, el fallback emoji se muestra */ }
    });
  }

  onLogoError(): void {
    this.logoUrl = null;
    refreshView(this.cdr);
  }

  /** true si el fondo configurado es un video (MP4/WEBM). */
  esVideoFondo(): boolean {
    return !!this.tema?.fondoUrl && this.customizacionService.esVideo(this.tema!.fondoUrl);
  }

  goRegistro(): void {
    this.router.navigate(['/registro']);
  }

  goLogin(): void {
    this.router.navigate(['/login']);
  }
}

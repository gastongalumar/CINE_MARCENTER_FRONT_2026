import { Component, HostBinding, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomizacionService } from '../../services/customizacion';

@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './splash.html',
  styleUrls: ['./splash.css'],
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

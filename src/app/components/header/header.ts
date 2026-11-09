import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CustomizacionService } from '../../services/customizacion';
import { ConfirmDialogService } from '../../services/confirm-dialog';
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
  private readonly confirmDialog = inject(ConfirmDialogService);

  tema$: Observable<Customizacion | null>;
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
    // Limpiar resto del antiguo toggle claro/oscuro (localStorage + clase)
    try {
      localStorage.removeItem('app-theme');
      document.body.classList.remove('light-theme');
    } catch (e) { /* no bloquear si hay error */ }

    this.tema$.subscribe(tema => {
      if (tema?.logoUrl) {
        this.logoUnavailable = false;
      }
    });
    this.customizacionService.obtenerTema().subscribe();
  }

  onLogoError(): void {
    this.logoUnavailable = true;
  }

  logout(): void {
    this.confirmDialog
      .confirm({
        title: 'Cerrar sesión',
        message: '¿Seguro que querés cerrar sesión? Vas a tener que volver a iniciar sesión para reservar o administrar el cine.',
        confirmText: 'Sí, salir',
        cancelText: 'Cancelar',
        icon: 'logout',
        danger: true,
      })
      .subscribe((confirmado) => {
        if (!confirmado) return;
        this.authService.logout();
        this.router.navigate(['/cartelera']);
      });
  }
}

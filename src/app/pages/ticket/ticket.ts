import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReservaService } from '../../services/reserva';
import { CustomizacionService } from '../../services/customizacion';
import { FechaApiPipe } from '../../pipes/fecha-api';

@Component({
  selector: 'app-ticket',
  standalone: true,
  imports: [CommonModule, FechaApiPipe],
  templateUrl: './ticket.html',
  styleUrls: ['./ticket.css']
})
export class TicketComponent implements OnInit {
  reserva: any = null;
  loading = true;
  logoUrl = '';
  cineNombre = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reservaService: ReservaService,
    private customizacionService: CustomizacionService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const numero = this.route.snapshot.paramMap.get('numero');
    this.customizacionService.obtenerTema().subscribe({
      next: (tema) => {
        this.logoUrl = tema.logoUrl || '/assets/images/logo-cine.jpg';
        this.cineNombre = tema.nombreCine || 'CINE';
      },
      error: () => {
        this.logoUrl = '/assets/images/logo-cine.jpg';
        this.cineNombre = 'CINE';
      }
    });

    if (numero) {
      this.reservaService.obtenerPorTicket(numero, { skipErrorToast: true }).subscribe({
        next: (r) => {
          this.reserva = r;
          this.loading = false;
          this.cd.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cd.markForCheck();
          void this.router.navigate(['/mis-reservas']);
        }
      });
    } else {
      this.loading = false;
      void this.router.navigate(['/mis-reservas']);
    }
  }

  get candyResumen(): string {
    const combos = this.reserva?.combos;
    if (!Array.isArray(combos) || !combos.length) return '';
    return combos
      .map((c: { cantidad?: number; nombre?: string }) => `${c.cantidad ?? 0}× ${c.nombre ?? 'Combo'}`)
      .join(' · ');
  }

  print() {
    if (typeof window !== 'undefined' && window.print) {
      window.print();
    }
  }

  volver() {
    void this.router.navigate(['/mis-reservas']);
  }
}


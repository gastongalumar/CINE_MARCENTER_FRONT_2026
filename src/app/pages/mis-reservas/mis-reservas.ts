import { Component, ChangeDetectorRef, Inject, PLATFORM_ID, afterNextRender } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ReservaService } from '../../services/reserva';
import { AuthService } from '../../services/auth';
import { ConfirmDialogService } from '../../services/confirm-dialog';
import { Reserva } from '../../models/reserva';
import { refreshView } from '../../utils/refresh-view';
import { FechaApiPipe } from '../../pipes/fecha-api';
import { EstadoReservaPipe, ClaseEstadoReservaPipe } from '../../pipes/estado-reserva';

@Component({
  selector: 'app-mis-reservas',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FechaApiPipe, EstadoReservaPipe, ClaseEstadoReservaPipe],
  templateUrl: './mis-reservas.html',
  styleUrls: ['./mis-reservas.css'],
})
export class MisReservasComponent {

  private readonly initLoad = afterNextRender(() => this.cargarReservas());
  reservas: Reserva[] = [];
  loading = true;
  cancelando = false;

  constructor(
    private reservaService: ReservaService,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService,
    private confirmDialog: ConfirmDialogService,
    private cd: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  cargarReservas(): void {
    this.reservas = [];
    this.loading = true;
    refreshView(this.cd);

    if (!this.authService.isAuthenticated()) {
      this.loading = false;
      refreshView(this.cd);
      return;
    }

    // Obtiene las reservas del usuario autenticado a partir del token JWT
    this.reservaService.listarMisReservas().subscribe({
      next: (data: Reserva[]) => {
        this.reservas = data || [];
        this.loading = false;
        refreshView(this.cd);
      },
      error: () => {
        this.loading = false;
        refreshView(this.cd);
      }
    });
  }

  verTicket(numeroTicket: string): void {
    this.router.navigate(['/ticket', numeroTicket]);
  }

  get reservasActivas(): Reserva[] {
    return this.reservas.filter(r => r.estadoReserva !== 'CANCELADA');
  }

  calcularTotalGastado(): number {
    return this.reservasActivas.reduce((total, r) => total + (r.montoTotal || 0), 0);
  }

  totalAsientos(): number {
    return this.reservasActivas.reduce((total, r) => total + (r.asientosSeleccionados?.length || 0), 0);
  }

  cancelarReserva(numeroTicket: string): void {
    this.confirmDialog
      .confirmDanger(
        'Cancelar reserva',
        `¿Estás seguro de cancelar la reserva ${numeroTicket}? Los asientos vuelven a quedar disponibles.`,
        'Sí, cancelar'
      )
      .subscribe((confirmado) => {
        if (!confirmado) return;
        this.cancelando = true;
        this.reservaService.cancelarReserva(numeroTicket).subscribe({
          next: () => {
            this.cancelando = false;
            this.toastr.success('Reserva cancelada correctamente.', 'Éxito');
            this.cargarReservas();
          },
          error: () => {
            this.cancelando = false;
          }
        });
      });
  }

}

import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ReservaService } from '../../services/reserva';
import { ValidacionTicketResponse } from '../../models/validacion-ticket';
import { getErrorMessage } from '../../utils/api-error';

@Component({
  selector: 'app-validar-ticket',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './validar-ticket.html',
  styleUrls: ['./validar-ticket.css'],
})
export class ValidarTicketComponent {
  numeroTicket = '';
  marcarUsado = true;
  validando = false;
  error = '';
  resultado: ValidacionTicketResponse | null = null;

  constructor(
    private reservaService: ReservaService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  validar(): void {
    const ticket = this.numeroTicket.trim().toUpperCase();
    if (!/^TK\d+$/.test(ticket)) {
      this.error = 'El ticket debe tener el formato TK seguido de dígitos.';
      this.cdr.markForCheck();
      return;
    }

    this.validando = true;
    this.error = '';
    this.resultado = null;
    this.cdr.markForCheck();

    this.reservaService.validarTicket(ticket, this.marcarUsado).subscribe({
      next: (response: import('../../models/validacion-ticket').ValidacionTicketResponse) => {
        this.validando = false;
        this.resultado = response;
        this.numeroTicket = response.numeroTicket || ticket;
        this.toastr.success(response.mensaje, 'Ticket validado');
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.validando = false;
        this.error = getErrorMessage(err, 'No se pudo validar el ticket.');
        this.cdr.markForCheck();
      }
    });
  }

  estadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      VALIDADO_AHORA: 'Validado ahora',
      YA_VALIDADO: 'Ya validado',
      VALIDO: 'Válido',
      CANCELADA: 'Cancelada'
    };
    return labels[estado] ?? estado;
  }

  estadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'VALIDADO_AHORA':
        return 'bg-success';
      case 'YA_VALIDADO':
        return 'bg-warning text-dark';
      case 'VALIDO':
        return 'bg-info';
      case 'CANCELADA':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }
}

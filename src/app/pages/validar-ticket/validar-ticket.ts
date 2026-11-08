import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ReservaService } from '../../services/reserva';
import { ValidacionTicketResponse } from '../../models/validacion-ticket';
import { getErrorMessage } from '../../utils/api-error';

@Component({
  selector: 'app-validar-ticket',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './validar-ticket.html',
  styleUrls: ['./validar-ticket.css'],
})
export class ValidarTicketComponent {
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    numeroTicket: ['', [Validators.required, Validators.pattern(/^TK\d+$/)]],
    marcarUsado: [true],
  });

  validando = false;
  error = '';
  resultado: ValidacionTicketResponse | null = null;

  constructor(
    private reservaService: ReservaService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  esInvalido(campo: string): boolean {
    const control = this.form.get(campo);
    return !!control && control.invalid && control.touched;
  }

  onCampoBlur(): void {
    this.cdr.markForCheck();
  }

  validar(): void {
    if (this.form.invalid) {
      return;
    }

    const ticket = this.form.controls.numeroTicket.value.trim().toUpperCase();
    const marcarUsado = this.form.controls.marcarUsado.value;

    this.validando = true;
    this.error = '';
    this.resultado = null;
    this.form.disable({ emitEvent: false });
    this.cdr.markForCheck();

    this.reservaService.validarTicket(ticket, marcarUsado).subscribe({
      next: (response: ValidacionTicketResponse) => {
        this.validando = false;
        this.form.enable({ emitEvent: false });
        this.resultado = response;
        this.form.patchValue({ numeroTicket: response.numeroTicket || ticket });
        this.toastr.success(response.mensaje, 'Ticket validado');
        this.cdr.markForCheck();
      },
      error: (err: unknown) => {
        this.validando = false;
        this.form.enable({ emitEvent: false });
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

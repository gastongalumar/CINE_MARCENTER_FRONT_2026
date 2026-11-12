import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ReservaService } from '../../services/reserva';
import { AuthService } from '../../services/auth';
import { Reserva } from '../../models/reserva';
import { FechaApiPipe } from '../../pipes/fecha-api';

type EstadoPago = 'exito' | 'error' | 'pendiente';

/**
 * Pantalla de resultado del checkout de Mercado Pago.
 *
 * Mercado Pago redirige a `/pago/{exito|error|pendiente}` agregando query
 * params (`external_reference`, `payment_id`, `status`, etc.). El componente
 * consulta las reservas del usuario para reflejar el estado real: el webhook
 * puede tardar unos segundos en marcar la reserva como pagada, por eso se
 * reintenta la consulta unas pocas veces.
 */
@Component({
  selector: 'app-pago-resultado',
  standalone: true,
  imports: [CommonModule, RouterModule, FechaApiPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pago-resultado.html',
  styleUrls: ['./pago-resultado.css'],
})
export class PagoResultadoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly reservaService = inject(ReservaService);
  private readonly authService = inject(AuthService);

  private static readonly MAX_INTENTOS = 5;
  private static readonly ESPERA_MS = 3000;

  readonly estado = signal<EstadoPago>('pendiente');
  readonly reserva = signal<Reserva | null>(null);
  readonly consultando = signal(false);
  readonly pagada = computed(() => this.reserva()?.pagada === true);
  readonly numeroTicket = computed(() => this.reserva()?.numeroTicket ?? null);

  readonly icono = computed(() => {
    switch (this.estado()) {
      case 'exito':
        return this.pagada() ? 'check_circle' : 'hourglass_top';
      case 'error':
        return 'cancel';
      default:
        return 'schedule';
    }
  });

  readonly titulo = computed(() => {
    switch (this.estado()) {
      case 'exito':
        return this.pagada() ? '¡Pago aprobado!' : 'Pago en proceso';
      case 'error':
        return 'Pago rechazado';
      default:
        return 'Pago pendiente';
    }
  });

  readonly mensaje = computed(() => {
    switch (this.estado()) {
      case 'exito':
        return this.pagada()
          ? 'Tu compra se acreditó correctamente y la reserva ya figura como pagada.'
          : 'Mercado Pago aprobó el pago. Estamos esperando la confirmación del servidor.';
      case 'error':
        return 'No pudimos procesar el pago. Podés intentarlo nuevamente desde la cartelera.';
      default:
        return 'Tu pago está siendo procesado. Te avisaremos cuando se acredite.';
    }
  });

  readonly detalleEstado = signal('');

  ngOnInit(): void {
    const estadoRuta = this.route.snapshot.data['estado'] as EstadoPago | undefined;
    this.estado.set(estadoRuta ?? 'pendiente');

    this.consultarEstado(0);
  }

  private consultarEstado(intento: number): void {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    this.consultando.set(true);

    const reservaId = this.obtenerReservaIdDeUrl();
    if (reservaId == null) {
      this.consultando.set(false);
      this.reserva.set(null);
      this.detalleEstado.set(
        'No se identificó la reserva del pago. Volvé desde Mercado Pago o revisá "Mis reservas".'
      );
      return;
    }

    this.reservaService.listarMisReservas().subscribe({
      next: (reservas) => {
        const encontrada = reservas.find((r) => r.id === reservaId) ?? null;

        this.reserva.set(encontrada);
        this.consultando.set(false);

        if (!encontrada) {
          this.detalleEstado.set(
            'No encontramos esa reserva en tu cuenta. Revisá "Mis reservas" en unos instantes.'
          );
          return;
        }

        if (encontrada.pagada) {
          this.detalleEstado.set('La reserva quedó registrada como PAGADA.');
          return;
        }

        if (this.estado() === 'error') {
          return;
        }

        if (intento < PagoResultadoComponent.MAX_INTENTOS) {
          setTimeout(
            () => this.consultarEstado(intento + 1),
            PagoResultadoComponent.ESPERA_MS
          );
        } else {
          this.detalleEstado.set(
            'Todavía no registramos la acreditación. Si el pago se realizó, la reserva se actualizará automáticamente en unos minutos.'
          );
        }
      },
      error: () => {
        this.consultando.set(false);
        this.detalleEstado.set(
          'No se pudo consultar el estado de la reserva. Revisá "Mis reservas" en unos instantes.'
        );
      },
    });
  }

  /** Mercado Pago agrega `external_reference` (id de reserva) al volver. */
  private obtenerReservaIdDeUrl(): number | null {
    const params = this.route.snapshot.queryParamMap;
    const valor =
      params.get('external_reference') ??
      params.get('reservaId') ??
      null;

    if (!valor) {
      return null;
    }

    const id = Number(valor);
    return Number.isFinite(id) ? id : null;
  }
}

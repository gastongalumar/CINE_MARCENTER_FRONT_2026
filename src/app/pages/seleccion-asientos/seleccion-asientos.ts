import { Component, ChangeDetectionStrategy, ChangeDetectorRef, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { FuncionService } from '../../services/funcion';
import { ReservaService } from '../../services/reserva';
import { AuthService } from '../../services/auth';
import { PaymentService } from '../../services/payment';
import { Funcion } from '../../models/funcion';
import { METODOS_PAGO, MetodoPago } from '../../models/metodo-pago';
import { finalize, timeout } from 'rxjs/operators';
import { getErrorMessage } from '../../utils/api-error';
import { refreshView } from '../../utils/refresh-view';
import { fechaLocalIso, parseApiDateTime } from '../../utils/datetime';
import { FechaApiPipe } from '../../pipes/fecha-api';
import { SeatMapComponent } from '../seat-map/seat-map';

export interface FuncionesPorDia {
  clave: string;
  funciones: Funcion[];
}

@Component({
  selector: 'app-seleccion-asientos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FechaApiPipe, SeatMapComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './seleccion-asientos.html',
  styleUrls: ['./seleccion-asientos.css'],
})
export class SeleccionAsientosComponent {

  private readonly initLoad = afterNextRender(() => {
    const id = this.route.snapshot.paramMap.get('id');
    this.peliculaId = id ? Number(id) : 0;
    this.esAdmin = this.authService.getTipoUsuario() === 'ADMINISTRADOR';
    this.cargarFunciones();
  });

  /** Opciones de método de pago (mock local, sin pasarela externa). */
  readonly metodosPago = METODOS_PAGO;

  // Flujo: paso 1 = elegir función, paso 2 = asientos, paso 3 = pago
  paso: 1 | 2 | 3 = 1;

  peliculaId: number = 0;
  funciones: Funcion[] = [];
  funcionesPorDia: FuncionesPorDia[] = [];
  diaSeleccionado = '';
  mostrandoOtrosDias = false;
  funcion: Funcion | null = null;
  asientosOcupados: string[] = [];
  asientosSeleccionados: string[] = [];
  metodoPago: MetodoPago = MetodoPago.MERCADO_PAGO;

  loadingFunciones = true;
  confirmando = false;

  /** Geometría de la sala de la función seleccionada. */
  salaFilas = 0;
  salaColumnas = 0;

  esAdmin = false;

  get totalAsientos(): number {
    return this.salaFilas * this.salaColumnas;
  }

  get nombrePelicula(): string {
    return this.funciones[0]?.peliculaNombre ?? '';
  }

  get hoyIso(): string {
    return fechaLocalIso();
  }

  get esDiaHoy(): boolean {
    return this.diaSeleccionado === this.hoyIso;
  }

  get hayFuncionesHoy(): boolean {
    return this.funcionesPorDia.some((g) => g.clave === this.hoyIso);
  }

  get hayOtrosDias(): boolean {
    return this.funcionesPorDia.some((g) => g.clave !== this.hoyIso);
  }

  get grupoSeleccionado(): FuncionesPorDia | null {
    return this.funcionesPorDia.find((g) => g.clave === this.diaSeleccionado) ?? null;
  }

  get funcionesDelDia(): Funcion[] {
    return this.grupoSeleccionado?.funciones ?? [];
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private funcionService: FuncionService,
    private reservaService: ReservaService,
    private paymentService: PaymentService,
    public authService: AuthService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  cargarFunciones(): void {
    this.loadingFunciones = true;
    this.funcionService.listarPorPelicula(this.peliculaId).subscribe({
      next: (funciones) => {
        // El backend devuelve también las funciones ya pasadas: filtramos las vigentes.
        this.funciones = (funciones ?? [])
          .filter((f) => !f.horario || new Date(f.horario).getTime() >= Date.now() - 60_000)
          .sort((a, b) => a.horario.localeCompare(b.horario));
        this.funcionesPorDia = this.agruparPorDia(this.funciones);
        this.inicializarDiaSeleccionado();
        this.mostrandoOtrosDias = false;
        this.loadingFunciones = false;
        refreshView(this.cdr);
      },
      error: (error: unknown) => {
        this.funciones = [];
        this.funcionesPorDia = [];
        this.diaSeleccionado = '';
        this.mostrandoOtrosDias = false;
        this.loadingFunciones = false;
        this.toastr.error(getErrorMessage(error, 'No se pudieron cargar las funciones.'), 'Error');
        refreshView(this.cdr);
      }
    });
  }

  private inicializarDiaSeleccionado(): void {
    const hoy = this.hoyIso;
    if (this.funcionesPorDia.some((g) => g.clave === hoy)) {
      this.diaSeleccionado = hoy;
      return;
    }
    // Si hoy no hay funciones, no preseleccionamos otro día: el usuario elige.
    this.diaSeleccionado = '';
  }

  private agruparPorDia(funciones: Funcion[]): FuncionesPorDia[] {
    const porDia = new Map<string, Funcion[]>();

    for (const funcion of funciones) {
      const fecha = parseApiDateTime(funcion.horario);
      const clave = fecha ? fechaLocalIso(fecha) : (funcion.horario?.slice(0, 10) ?? 'sin-fecha');
      const grupo = porDia.get(clave);
      if (grupo) {
        grupo.push(funcion);
      } else {
        porDia.set(clave, [funcion]);
      }
    }

    return [...porDia.entries()].map(([clave, items]) => ({ clave, funciones: items }));
  }

  toggleOtrosDias(): void {
    this.mostrandoOtrosDias = !this.mostrandoOtrosDias;
    refreshView(this.cdr);
  }

  elegirDia(clave: string): void {
    this.diaSeleccionado = clave;
    this.mostrandoOtrosDias = false;
    refreshView(this.cdr);
  }

  volverAHoy(): void {
    if (!this.hayFuncionesHoy) return;
    this.diaSeleccionado = this.hoyIso;
    this.mostrandoOtrosDias = false;
    refreshView(this.cdr);
  }

  elegirFuncion(funcion: Funcion): void {
    this.funcion = funcion;
    this.asientosSeleccionados = [];
    this.construirGrid(funcion);
    this.cargarAsientosOcupados(funcion.id!);
    this.paso = 2;
    refreshView(this.cdr);
  }

  construirGrid(funcion: Funcion): void {
    this.salaFilas = funcion.salaFilas || 0;
    this.salaColumnas = funcion.salaColumnas || 0;
  }

  cargarAsientosOcupados(funcionId: number): void {
    this.funcionService.obtenerAsientosOcupados(funcionId).subscribe({
      next: (ocupados: string[]) => {
        this.asientosOcupados = ocupados || [];
        refreshView(this.cdr);
      },
      error: () => {
        this.asientosOcupados = [];
        refreshView(this.cdr);
      }
    });
  }

  calcularTotal(): number {
    if (!this.funcion) return 0;
    return this.asientosSeleccionados.length * this.funcion.precio;
  }

  confirmarCompra(): void {
    const clienteId = this.authService.getUserId();
    const tipo = this.authService.getTipoUsuario();

    if (!clienteId || !this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/butacas/${this.peliculaId}` },
      });
      return;
    }

    if (tipo === 'ADMINISTRADOR') {
      this.toastr.warning(
        'Para comprar entradas debés iniciar sesión con una cuenta de cliente.',
        'Acceso restringido'
      );
      return;
    }

    if (!this.funcion?.id) {
      this.toastr.error('Seleccione una función válida.', 'Error');
      return;
    }

    if (this.asientosSeleccionados.length === 0) {
      this.toastr.error('Seleccione al menos un asiento.', 'Error');
      return;
    }

    this.confirmando = true;
    refreshView(this.cdr);

    this.reservaService.crearReserva({
      funcionId: this.funcion.id,
      asientosSeleccionados: this.asientosSeleccionados,
      metodoPago: this.metodoPago,
    })
      .pipe(
        timeout(30000),
        finalize(() => {
          this.confirmando = false;
          refreshView(this.cdr);
        })
      )
      .subscribe({
        next: (reserva) => {
          // Con Mercado Pago se crea la preferencia y se redirige al checkout.
          if (this.metodoPago === MetodoPago.MERCADO_PAGO && reserva.id != null) {
            this.paymentService.crearPreferencia(reserva.id).subscribe({
              next: (preferencia) => {
                const initPoint = preferencia.init_point || preferencia.sandbox_init_point;
                if (!initPoint) {
                  this.toastr.error(
                    'Mercado Pago no devolvió una URL de pago. Intentá nuevamente.',
                    'Error'
                  );
                  return;
                }
                this.toastr.info('Redirigiendo a Mercado Pago…', 'Pago');
                window.location.href = initPoint;
              },
              error: (error: unknown) => {
                this.toastr.error(
                  getErrorMessage(error, 'No se pudo iniciar el pago con Mercado Pago.'),
                  'Error'
                );
              },
            });
            return;
          }

          const ticket = reserva.numeroTicket || (reserva.id != null ? String(reserva.id) : '');
          if (!ticket) {
            this.toastr.error('Reserva creada pero no se recibió el número de ticket.', 'Error');
            return;
          }
          this.toastr.success('¡Reserva confirmada! Tu ticket está listo.', 'Éxito');
          this.router.navigate(['/ticket', ticket]);
        },
        error: (error: unknown) => {
          const esTimeout = (error as { name?: string })?.name === 'TimeoutError';
          this.toastr.error(
            esTimeout
              ? 'El servidor no respondió. Verifique que el backend esté en ejecución (puerto 8080).'
              : getErrorMessage(error, 'No se pudo confirmar la compra.'),
            'Error'
          );
        },
      });
  }

  volver(): void {
    this.router.navigate(['/cartelera']);
  }
}

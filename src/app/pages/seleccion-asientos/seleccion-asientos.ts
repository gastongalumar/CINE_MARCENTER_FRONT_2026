import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  afterNextRender,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { EMPTY, Subscription, interval } from 'rxjs';
import { catchError, finalize, startWith, switchMap, timeout } from 'rxjs/operators';
import { FuncionService } from '../../services/funcion';
import { ReservaService } from '../../services/reserva';
import { HoldService } from '../../services/hold.service';
import { AuthService } from '../../services/auth';
import { PaymentService } from '../../services/payment';
import { Funcion } from '../../models/funcion';
import { METODOS_PAGO, MetodoPago } from '../../models/metodo-pago';
import { getErrorMessage } from '../../utils/api-error';
import { refreshView } from '../../utils/refresh-view';
import { fechaLocalIso, parseApiDateTime } from '../../utils/datetime';
import { FechaApiPipe } from '../../pipes/fecha-api';
import { SeatMapComponent } from '../seat-map/seat-map';
import { autorizarButacas } from '../../utils/butacas-access';
import { EstadoAsientos } from '../../models/estado-asientos.model';

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
export class SeleccionAsientosComponent implements OnDestroy {

  private readonly initLoad = afterNextRender(() => {
    const id = this.route.snapshot.paramMap.get('id');
    this.peliculaId = id ? Number(id) : 0;
    this.esAdmin = this.authService.isAdmin();
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
  asientosBloqueados: string[] = [];
  asientosSeleccionados: string[] = [];
  readonly pollMs = 2500;
  pollingSub: Subscription | null = null;
  metodoPago: MetodoPago = MetodoPago.MERCADO_PAGO;

  loadingFunciones = true;
  confirmando = false;

  /** Geometría de la sala de la función seleccionada. */
  salaFilas = 0;
  salaColumnas = 0;

  esAdmin = false;

  private readonly holdsLiberandose = new Set<string>();
  private errorPollingNotificado = false;
  private cleanupSolicitado = false;

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
    private holdService: HoldService,
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
    if (funcion.id == null) {
      this.toastr.error('Seleccione una función válida.', 'Error');
      return;
    }

    this.detenerPollingYLiberarHolds();
    this.funcion = funcion;
    this.asientosSeleccionados = [];
    this.asientosOcupados = [];
    this.asientosBloqueados = [];
    this.holdsLiberandose.clear();
    this.cleanupSolicitado = false;
    this.construirGrid(funcion);
    this.paso = 2;
    this.iniciarPollingEstado(funcion.id);
    refreshView(this.cdr);
  }

  construirGrid(funcion: Funcion): void {
    this.salaFilas = funcion.salaFilas || 0;
    this.salaColumnas = funcion.salaColumnas || 0;
  }

  iniciarPollingEstado(funcionId: number): void {
    this.detenerPolling();
    this.errorPollingNotificado = false;
    this.pollingSub = interval(this.pollMs).pipe(
      startWith(0),
      switchMap(() => this.funcionService.obtenerEstadoAsientos(funcionId).pipe(
        catchError((error: unknown) => {
          if (!this.errorPollingNotificado) {
            this.toastr.warning(
              getErrorMessage(error, 'No se pudo actualizar el estado de los asientos.'),
              'Sincronización'
            );
            this.errorPollingNotificado = true;
          }
          return EMPTY;
        })
      ))
    ).subscribe((estado) => {
      this.aplicarEstadoAsientos(estado);
      this.errorPollingNotificado = false;
      refreshView(this.cdr);
    });
  }

  aplicarEstadoAsientos(estado: EstadoAsientos): void {
    this.asientosOcupados = (estado.ocupados ?? []).map((etiqueta) => etiqueta.trim().toUpperCase());
    this.asientosBloqueados = (estado.bloqueados ?? []).map((etiqueta) => etiqueta.trim().toUpperCase());
    const misBloqueados = new Set(
      (estado.misBloqueados ?? []).map((etiqueta) => etiqueta.trim().toUpperCase())
    );

    for (const etiqueta of this.holdsLiberandose) {
      if (!misBloqueados.has(etiqueta)) this.holdsLiberandose.delete(etiqueta);
    }

    const ocupados = new Set(this.asientosOcupados);
    const bloqueados = new Set(this.asientosBloqueados);
    const seleccion = new Set([...misBloqueados, ...this.asientosSeleccionados]);

    for (const etiqueta of seleccion) {
      if (ocupados.has(etiqueta) || bloqueados.has(etiqueta) || this.holdsLiberandose.has(etiqueta)) {
        seleccion.delete(etiqueta);
      }
    }

    this.asientosSeleccionados = [...seleccion].sort();
  }

  onSeleccionChange(nuevaSeleccion: string[]): void {
    if (this.esAdmin || !this.authService.isAuthenticated() || !this.authService.isCliente()) return;
    const funcionId = this.funcion?.id;
    if (funcionId == null) return;

    const anterior = new Set(this.asientosSeleccionados);
    const nueva = new Set(nuevaSeleccion.map((etiqueta) => etiqueta.trim().toUpperCase()));
    const agregados = [...nueva].filter((etiqueta) => !anterior.has(etiqueta));
    const quitados = [...anterior].filter((etiqueta) => !nueva.has(etiqueta));

    this.asientosSeleccionados = [...nueva].sort();
    refreshView(this.cdr);

    for (const etiqueta of agregados) {
      this.holdsLiberandose.delete(etiqueta);
      this.holdService.crear(funcionId, etiqueta).subscribe({
        error: (error: unknown) => {
          this.asientosSeleccionados = this.asientosSeleccionados.filter((item) => item !== etiqueta);
          if (this.esConflicto(error)) {
            this.toastr.warning('Asiento no disponible', 'Selección');
          } else {
            this.toastr.error(getErrorMessage(error, 'No se pudo bloquear el asiento.'), 'Error');
          }
          this.refrescarEstadoAsientos(funcionId);
          refreshView(this.cdr);
        },
      });
    }

    for (const etiqueta of quitados) {
      this.holdsLiberandose.add(etiqueta);
      this.holdService.liberar(funcionId, etiqueta).subscribe({
        error: (error: unknown) => {
          this.holdsLiberandose.delete(etiqueta);
          this.toastr.warning(
            getErrorMessage(error, 'No se pudo liberar el asiento; se volverá a sincronizar.'),
            'Sincronización'
          );
          this.refrescarEstadoAsientos(funcionId);
        },
      });
    }
  }

  private refrescarEstadoAsientos(funcionId: number): void {
    this.funcionService.obtenerEstadoAsientos(funcionId).subscribe({
      next: (estado) => {
        this.aplicarEstadoAsientos(estado);
        refreshView(this.cdr);
      },
      error: (error: unknown) => {
        this.toastr.warning(
          getErrorMessage(error, 'No se pudo actualizar el estado de los asientos.'),
          'Sincronización'
        );
      },
    });
  }

  private esConflicto(error: unknown): boolean {
    if (error instanceof HttpErrorResponse) return error.status === 409;
    return (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      error.status === 409
    );
  }

  private detenerPolling(): void {
    this.pollingSub?.unsubscribe();
    this.pollingSub = null;
  }

  detenerPollingYLiberarHolds(): void {
    this.detenerPolling();
    const funcionId = this.funcion?.id;
    if (
      funcionId == null ||
      this.esAdmin ||
      !this.authService.isAuthenticated() ||
      !this.authService.isCliente() ||
      this.cleanupSolicitado
    ) {
      return;
    }

    this.cleanupSolicitado = true;
    this.holdService.liberarTodos(funcionId).subscribe({
      error: (error: unknown) => {
        this.toastr.warning(
          getErrorMessage(error, 'No se pudieron liberar los asientos seleccionados.'),
          'Sincronización'
        );
      },
    });
  }

  volverAHorarios(): void {
    this.detenerPollingYLiberarHolds();
    this.funcion = null;
    this.asientosSeleccionados = [];
    this.asientosOcupados = [];
    this.asientosBloqueados = [];
    this.paso = 1;
    refreshView(this.cdr);
  }

  cancelarCompra(): void {
    this.detenerPollingYLiberarHolds();
    this.router.navigate(['/cartelera']);
  }

  ngOnDestroy(): void {
    this.detenerPollingYLiberarHolds();
  }

  calcularTotal(): number {
    if (!this.funcion) return 0;
    return this.asientosSeleccionados.length * this.funcion.precio;
  }

  confirmarCompra(): void {
    const clienteId = this.authService.getUserId();
    const tipo = this.authService.getTipoUsuario();

    if (!clienteId || !this.authService.isAuthenticated()) {
      autorizarButacas(this.peliculaId);
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/butacas/${this.peliculaId}` },
      });
      return;
    }

    if (tipo === 'ADMINISTRADOR' || tipo === 'SUPERADMIN') {
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
          this.detenerPolling();
          this.cleanupSolicitado = true;
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
    this.detenerPollingYLiberarHolds();
    this.router.navigate(['/cartelera']);
  }
}

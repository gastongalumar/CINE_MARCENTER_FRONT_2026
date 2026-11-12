import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  afterNextRender,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize, timeout } from 'rxjs/operators';
import { FuncionService } from '../../services/funcion';
import { ReservaService } from '../../services/reserva';
import { HoldService } from '../../services/hold.service';
import { AuthService } from '../../services/auth';
import { PaymentService } from '../../services/payment';
import { CandyComboService } from '../../services/candy-combo';
import { CodigoDescuentoService } from '../../services/codigo-descuento';
import {
  CompraFlujoService,
  MAX_ENTRADAS_COMPRA,
} from '../../services/compra-flujo.service';
import { Funcion } from '../../models/funcion';
import { CandyCombo } from '../../models/candy-combo';
import { METODOS_PAGO, MetodoPago } from '../../models/metodo-pago';
import { getErrorMessage } from '../../utils/api-error';
import { refreshView } from '../../utils/refresh-view';
import { FechaApiPipe } from '../../pipes/fecha-api';
import { autorizarButacas } from '../../utils/butacas-access';

@Component({
  selector: 'app-compra-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FechaApiPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './compra-checkout.html',
  styleUrls: ['./compra-flujo.shared.css'],
})
export class CompraCheckoutComponent implements OnDestroy {
  private readonly initLoad = afterNextRender(() => {
    this.peliculaId = Number(this.route.snapshot.paramMap.get('peliculaId')) || 0;
    this.funcionId = Number(this.route.snapshot.paramMap.get('funcionId')) || 0;
    this.asientosSeleccionados = [...this.compraFlujo.asientosSeleccionados];
    this.cargarFuncion();
    this.cargarCombos();
  });

  readonly metodosPago = METODOS_PAGO;
  readonly maxEntradasCompra = MAX_ENTRADAS_COMPRA;

  peliculaId = 0;
  funcionId = 0;
  funcion: Funcion | null = null;
  asientosSeleccionados: string[] = [];
  metodoPago: MetodoPago = MetodoPago.MERCADO_PAGO;

  candyCombos: CandyCombo[] = [];
  combosElegidos: Record<number, number> = {};
  codigoInput = '';
  codigoAplicado: string | null = null;
  descuentoMonto = 0;
  codigoMensaje = '';
  codigoError = '';
  validandoCodigo = false;
  confirmando = false;
  loading = true;

  /** Reserva ya creada esperando preferencia MP (permite reintento sin clear). */
  reservaPendientePagoId: number | null = null;

  private cleanupSolicitado = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private funcionService: FuncionService,
    private reservaService: ReservaService,
    private holdService: HoldService,
    private paymentService: PaymentService,
    private candyComboService: CandyComboService,
    private codigoDescuentoService: CodigoDescuentoService,
    public authService: AuthService,
    private compraFlujo: CompraFlujoService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  get subtotalEntradas(): number {
    if (!this.funcion) return 0;
    return this.asientosSeleccionados.length * this.funcion.precio;
  }

  get subtotalCandy(): number {
    return this.candyCombos.reduce((acc, c) => acc + c.precio * this.cantidadCombo(c.id), 0);
  }

  get subtotalBruto(): number {
    return this.subtotalEntradas + this.subtotalCandy;
  }

  private cargarFuncion(): void {
    this.loading = true;
    this.funcionService.obtenerPorId(this.funcionId).subscribe({
      next: (funcion) => {
        this.funcion = funcion;
        this.loading = false;
        refreshView(this.cdr);
      },
      error: (error: unknown) => {
        this.loading = false;
        this.toastr.error(getErrorMessage(error, 'No se pudo cargar la función.'), 'Error');
        this.router.navigate(['/butacas', this.peliculaId, 'funcion', this.funcionId]);
      },
    });
  }

  cargarCombos(): void {
    this.candyComboService.listarActivos().subscribe({
      next: (combos) => {
        this.candyCombos = combos;
        refreshView(this.cdr);
      },
      error: () => {
        this.candyCombos = [];
        refreshView(this.cdr);
      },
    });
  }

  cantidadCombo(comboId: number): number {
    return this.combosElegidos[comboId] ?? 0;
  }

  setCantidadCombo(comboId: number, cantidad: number): void {
    const n = Math.max(0, Math.min(20, Math.floor(cantidad || 0)));
    if (n <= 0) {
      delete this.combosElegidos[comboId];
    } else {
      this.combosElegidos[comboId] = n;
    }
    this.revalidarCodigoSiHay();
    refreshView(this.cdr);
  }

  calcularTotal(): number {
    return Math.max(0, this.subtotalBruto - this.descuentoMonto);
  }

  aplicarCodigo(): void {
    const codigo = this.codigoInput.trim();
    if (!codigo) {
      this.codigoError = 'Ingresá un código';
      return;
    }
    if (!this.authService.isAuthenticated() || this.authService.getTipoUsuario() !== 'CLIENTE') {
      this.toastr.warning('Tenés que iniciar sesión como cliente para usar un código.', 'Descuento');
      return;
    }

    this.validandoCodigo = true;
    this.codigoError = '';
    this.codigoMensaje = '';
    refreshView(this.cdr);

    this.codigoDescuentoService.validar(codigo, this.subtotalBruto).subscribe({
      next: (res) => {
        this.validandoCodigo = false;
        if (!res.valido) {
          this.codigoAplicado = null;
          this.descuentoMonto = 0;
          this.codigoError = res.mensaje || 'Código inválido';
        } else {
          this.codigoAplicado = res.codigo || codigo.toUpperCase();
          this.descuentoMonto = res.descuentoMonto || 0;
          this.codigoMensaje = res.mensaje || 'Código aplicado';
          this.codigoError = '';
        }
        refreshView(this.cdr);
      },
      error: (err) => {
        this.validandoCodigo = false;
        this.codigoAplicado = null;
        this.descuentoMonto = 0;
        this.codigoError = getErrorMessage(err, 'No se pudo validar el código');
        refreshView(this.cdr);
      },
    });
  }

  quitarCodigo(): void {
    this.codigoAplicado = null;
    this.descuentoMonto = 0;
    this.codigoInput = '';
    this.codigoMensaje = '';
    this.codigoError = '';
    refreshView(this.cdr);
  }

  private revalidarCodigoSiHay(): void {
    if (!this.codigoAplicado) {
      this.descuentoMonto = 0;
      return;
    }
    this.codigoDescuentoService.validar(this.codigoAplicado, this.subtotalBruto).subscribe({
      next: (res) => {
        if (!res.valido) {
          this.codigoAplicado = null;
          this.descuentoMonto = 0;
          this.codigoMensaje = '';
          this.codigoError = res.mensaje || 'El código ya no aplica';
        } else {
          this.descuentoMonto = res.descuentoMonto || 0;
        }
        refreshView(this.cdr);
      },
      error: () => {
        /* silencio: el back vuelve a validar al confirmar */
      },
    });
  }

  private combosParaRequest() {
    return Object.entries(this.combosElegidos)
      .filter(([, cantidad]) => cantidad > 0)
      .map(([comboId, cantidad]) => ({ comboId: Number(comboId), cantidad }));
  }

  volverAAsientos(): void {
    // Holds y selección se conservan; el destroy no libera si seguimos en el flujo.
    this.router.navigate(['/butacas', this.peliculaId, 'funcion', this.funcionId]);
  }

  cancelarCompra(): void {
    this.liberarHolds();
    this.compraFlujo.clear();
    this.router.navigate(['/cartelera']);
  }

  confirmarCompra(): void {
    if (this.reservaPendientePagoId != null) {
      this.reintentarPreferencia();
      return;
    }

    const clienteId = this.authService.getUserId();
    const tipo = this.authService.getTipoUsuario();

    if (!clienteId || !this.authService.isAuthenticated()) {
      autorizarButacas(this.peliculaId);
      this.router.navigate(['/login'], {
        queryParams: {
          returnUrl: `/butacas/${this.peliculaId}/funcion/${this.funcionId}`,
        },
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

    if (this.asientosSeleccionados.length > this.maxEntradasCompra) {
      this.toastr.error(
        `Máximo ${this.maxEntradasCompra} entradas por compra.`,
        'Error'
      );
      return;
    }

    this.confirmando = true;
    refreshView(this.cdr);

    this.reservaService
      .crearReserva({
        funcionId: this.funcion.id,
        asientosSeleccionados: this.asientosSeleccionados,
        metodoPago: this.metodoPago,
        combos: this.combosParaRequest(),
        codigoDescuento: this.codigoAplicado || undefined,
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
          if (this.metodoPago === MetodoPago.MERCADO_PAGO && reserva.id != null) {
            this.reservaPendientePagoId = reserva.id;
            this.iniciarPreferenciaMercadoPago(reserva.id);
            return;
          }

          const ticket = reserva.numeroTicket || (reserva.id != null ? String(reserva.id) : '');
          if (!ticket) {
            this.toastr.error('Reserva creada pero no se recibió el número de ticket.', 'Error');
            return;
          }
          this.finalizarCompraExitosa();
          this.toastr.success('¡Reserva confirmada! Tu ticket está listo.', 'Éxito');
          this.router.navigate(['/ticket', ticket]);
        },
        error: (error: unknown) => {
          const esTimeout = (error as { name?: string })?.name === 'TimeoutError';
          if (esTimeout) {
            this.toastr.error(
              'El servidor no respondió. Verifique que el backend esté en ejecución (puerto 8080).',
              'Error'
            );
          }
        },
      });
  }

  /** Reintenta crear la preferencia MP para la reserva ya creada. */
  reintentarPreferencia(): void {
    if (this.reservaPendientePagoId == null) return;
    this.iniciarPreferenciaMercadoPago(this.reservaPendientePagoId);
  }

  private iniciarPreferenciaMercadoPago(reservaId: number): void {
    this.confirmando = true;
    refreshView(this.cdr);

    this.paymentService
      .crearPreferencia(reservaId)
      .pipe(
        finalize(() => {
          this.confirmando = false;
          refreshView(this.cdr);
        })
      )
      .subscribe({
        next: (preferencia) => {
          const initPoint = preferencia.init_point || preferencia.sandbox_init_point;
          if (!initPoint) {
            this.toastr.error(
              'Mercado Pago no devolvió una URL de pago. Podés reintentar el pago.',
              'Error'
            );
            return;
          }
          this.finalizarCompraExitosa();
          this.toastr.info('Redirigiendo a Mercado Pago…', 'Pago');
          window.location.href = initPoint;
        },
        error: () => {
          this.toastr.warning(
            'No se pudo iniciar el pago. Tu reserva sigue creada: reintentá el pago.',
            'Pago'
          );
        },
      });
  }

  private finalizarCompraExitosa(): void {
    this.cleanupSolicitado = true;
    this.reservaPendientePagoId = null;
    this.compraFlujo.clear();
  }

  private liberarHolds(): void {
    if (
      this.cleanupSolicitado ||
      !this.authService.isAuthenticated() ||
      !this.authService.isCliente()
    ) {
      return;
    }
    this.cleanupSolicitado = true;
    this.holdService.liberarTodos(this.funcionId).subscribe({
      error: (error: unknown) => {
        this.toastr.warning(
          getErrorMessage(error, 'No se pudieron liberar los asientos seleccionados.'),
          'Sincronización'
        );
      },
    });
  }

  ngOnDestroy(): void {
    if (this.cleanupSolicitado) return;

    // Atrás a asientos, F5 no aplica acá, o redirect a login: no liberar holds.
    const url = this.router.url;
    const sigueEnFlujo =
      url.startsWith(`/butacas/${this.peliculaId}`) || url.startsWith('/login');
    if (sigueEnFlujo) {
      return;
    }

    this.liberarHolds();
    this.compraFlujo.clear();
  }
}

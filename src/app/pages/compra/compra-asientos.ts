import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  afterNextRender,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { EMPTY, Subscription, interval } from 'rxjs';
import { catchError, startWith, switchMap } from 'rxjs/operators';
import { FuncionService } from '../../services/funcion';
import { HoldService } from '../../services/hold.service';
import { AuthService } from '../../services/auth';
import {
  CompraFlujoService,
  MAX_ENTRADAS_COMPRA,
} from '../../services/compra-flujo.service';
import { Funcion } from '../../models/funcion';
import { getErrorMessage } from '../../utils/api-error';
import { refreshView } from '../../utils/refresh-view';
import { FechaApiPipe } from '../../pipes/fecha-api';
import { SeatMapComponent } from '../seat-map/seat-map';
import { EstadoAsientos } from '../../models/estado-asientos.model';

@Component({
  selector: 'app-compra-asientos',
  standalone: true,
  imports: [CommonModule, RouterModule, FechaApiPipe, SeatMapComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './compra-asientos.html',
  styleUrls: ['./compra-flujo.shared.css'],
})
export class CompraAsientosComponent implements OnDestroy {
  private readonly initLoad = afterNextRender(() => {
    this.peliculaId = Number(this.route.snapshot.paramMap.get('peliculaId')) || 0;
    this.funcionId = Number(this.route.snapshot.paramMap.get('funcionId')) || 0;
    this.esAdmin = this.authService.isAdmin();
    this.compraFlujo.setContexto(this.peliculaId, this.funcionId);

    if (
      this.compraFlujo.funcionId === this.funcionId &&
      this.compraFlujo.asientosSeleccionados.length > 0
    ) {
      this.asientosSeleccionados = [...this.compraFlujo.asientosSeleccionados];
    }

    this.cargarFuncion();
  });

  peliculaId = 0;
  funcionId = 0;
  funcion: Funcion | null = null;
  asientosOcupados: string[] = [];
  asientosBloqueados: string[] = [];
  asientosSeleccionados: string[] = [];
  readonly maxEntradasCompra = MAX_ENTRADAS_COMPRA;
  readonly pollMs = 2500;
  pollingSub: Subscription | null = null;
  salaFilas = 0;
  salaColumnas = 0;
  esAdmin = false;
  loading = true;

  private readonly holdsLiberandose = new Set<string>();
  private errorPollingNotificado = false;
  private cleanupSolicitado = false;

  get totalAsientos(): number {
    return this.salaFilas * this.salaColumnas;
  }

  get entradasSeleccionadas(): number {
    return this.asientosSeleccionados.length;
  }

  get entradasRestantes(): number {
    return Math.max(0, this.maxEntradasCompra - this.asientosSeleccionados.length);
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private funcionService: FuncionService,
    private holdService: HoldService,
    public authService: AuthService,
    private compraFlujo: CompraFlujoService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  private cargarFuncion(): void {
    this.loading = true;
    this.funcionService.obtenerPorId(this.funcionId).subscribe({
      next: (funcion) => {
        if (funcion.peliculaId != null && funcion.peliculaId !== this.peliculaId) {
          this.toastr.error('La función no corresponde a esta película.', 'Error');
          this.router.navigate(['/butacas', this.peliculaId]);
          return;
        }
        this.funcion = funcion;
        this.salaFilas = funcion.salaFilas || 0;
        this.salaColumnas = funcion.salaColumnas || 0;
        this.loading = false;
        this.iniciarPollingEstado(this.funcionId);
        refreshView(this.cdr);
      },
      error: (error: unknown) => {
        this.loading = false;
        this.toastr.error(getErrorMessage(error, 'No se pudo cargar la función.'), 'Error');
        this.router.navigate(['/butacas', this.peliculaId]);
      },
    });
  }

  iniciarPollingEstado(funcionId: number): void {
    this.detenerPolling();
    this.errorPollingNotificado = false;
    this.pollingSub = interval(this.pollMs)
      .pipe(
        startWith(0),
        switchMap(() =>
          this.funcionService.obtenerEstadoAsientos(funcionId).pipe(
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
          )
        )
      )
      .subscribe((estado) => {
        this.aplicarEstadoAsientos(estado);
        this.errorPollingNotificado = false;
        refreshView(this.cdr);
      });
  }

  aplicarEstadoAsientos(estado: EstadoAsientos): void {
    this.asientosOcupados = (estado.ocupados ?? []).map((etiqueta) => etiqueta.trim().toUpperCase());
    this.asientosBloqueados = (estado.bloqueados ?? []).map((etiqueta) =>
      etiqueta.trim().toUpperCase()
    );
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
      if (
        ocupados.has(etiqueta) ||
        bloqueados.has(etiqueta) ||
        this.holdsLiberandose.has(etiqueta)
      ) {
        seleccion.delete(etiqueta);
      }
    }

    this.asientosSeleccionados = [...seleccion].sort();
    this.compraFlujo.setSeleccion(this.asientosSeleccionados);
  }

  onLimiteEntradasAlcanzado(): void {
    this.toastr.warning(
      `Máximo ${this.maxEntradasCompra} entradas por compra.`,
      'Selección'
    );
  }

  deseleccionarTodos(): void {
    if (this.esAdmin || this.asientosSeleccionados.length === 0) return;
    this.onSeleccionChange([]);
  }

  onSeleccionChange(nuevaSeleccion: string[]): void {
    if (this.esAdmin || !this.authService.isAuthenticated() || !this.authService.isCliente()) {
      return;
    }
    if (this.funcionId == null) return;

    const anterior = new Set(this.asientosSeleccionados);
    let nuevaLista = nuevaSeleccion.map((etiqueta) => etiqueta.trim().toUpperCase());

    if (nuevaLista.length > this.maxEntradasCompra) {
      this.onLimiteEntradasAlcanzado();
      refreshView(this.cdr);
      return;
    }

    const nueva = new Set(nuevaLista);
    const agregados = [...nueva].filter((etiqueta) => !anterior.has(etiqueta));
    const quitados = [...anterior].filter((etiqueta) => !nueva.has(etiqueta));

    this.asientosSeleccionados = [...nueva].sort();
    this.compraFlujo.setSeleccion(this.asientosSeleccionados);
    refreshView(this.cdr);

    for (const etiqueta of agregados) {
      this.holdsLiberandose.delete(etiqueta);
      this.holdService.crear(this.funcionId, etiqueta).subscribe({
        error: (error: unknown) => {
          this.asientosSeleccionados = this.asientosSeleccionados.filter(
            (item) => item !== etiqueta
          );
          this.compraFlujo.setSeleccion(this.asientosSeleccionados);
          if (this.esConflicto(error)) {
            this.toastr.warning('Asiento no disponible', 'Selección');
          } else {
            this.toastr.error(getErrorMessage(error, 'No se pudo bloquear el asiento.'), 'Error');
          }
          this.refrescarEstadoAsientos(this.funcionId);
          refreshView(this.cdr);
        },
      });
    }

    for (const etiqueta of quitados) {
      this.holdsLiberandose.add(etiqueta);
      this.holdService.liberar(this.funcionId, etiqueta).subscribe({
        error: (error: unknown) => {
          this.holdsLiberandose.delete(etiqueta);
          this.toastr.warning(
            getErrorMessage(error, 'No se pudo liberar el asiento; se volverá a sincronizar.'),
            'Sincronización'
          );
          this.refrescarEstadoAsientos(this.funcionId);
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
      (error as { status: number }).status === 409
    );
  }

  private detenerPolling(): void {
    this.pollingSub?.unsubscribe();
    this.pollingSub = null;
  }

  private liberarHoldsSiCorresponde(): void {
    this.detenerPolling();
    if (
      this.funcionId == null ||
      this.esAdmin ||
      !this.authService.isAuthenticated() ||
      !this.authService.isCliente() ||
      this.cleanupSolicitado
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

  continuarAlPago(): void {
    if (this.asientosSeleccionados.length === 0) return;
    this.compraFlujo.setSeleccion(this.asientosSeleccionados);
    this.compraFlujo.marcarNavegacionAPago();
    this.router.navigate(['/butacas', this.peliculaId, 'funcion', this.funcionId, 'pago']);
  }

  volverAHorarios(): void {
    this.liberarHoldsSiCorresponde();
    this.compraFlujo.clear();
    this.router.navigate(['/butacas', this.peliculaId]);
  }

  volver(): void {
    this.liberarHoldsSiCorresponde();
    this.compraFlujo.clear();
    this.router.navigate(['/cartelera']);
  }

  calcularTotalEntradas(): number {
    if (!this.funcion) return 0;
    return this.asientosSeleccionados.length * this.funcion.precio;
  }

  ngOnDestroy(): void {
    if (this.compraFlujo.consumirPreservarHolds()) {
      this.detenerPolling();
      return;
    }
    this.liberarHoldsSiCorresponde();
  }
}

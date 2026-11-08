import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize, Observable } from 'rxjs';

import { EstadisticasService } from '../../services/estadisticas';
import {
  MetodoPagoEstadistica,
  OcupacionFuncion,
  VentaDiaria,
  VentaPelicula,
  VentaSala,
} from '../../models/estadisticas';
import { getErrorMessage } from '../../utils/api-error';
import { FechaApiPipe } from '../../pipes/fecha-api';

type TabId = 'ventas-diarias' | 'peliculas' | 'salas' | 'funciones' | 'pagos';

/**
 * Reportes tabulares del panel de administración. Complementa al dashboard:
 * el dashboard resume y grafica, esta pantalla permite ver el detalle.
 */
@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FechaApiPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './estadisticas.html',
  styleUrls: ['./estadisticas.css'],
})
export class EstadisticasComponent implements OnInit {
  private readonly estadisticas = inject(EstadisticasService);
  private readonly route = inject(ActivatedRoute);

  readonly tabs: { id: TabId; icono: string; label: string }[] = [
    { id: 'ventas-diarias', icono: 'calendar_month', label: 'Ventas diarias' },
    { id: 'peliculas', icono: 'movie', label: 'Por película' },
    { id: 'salas', icono: 'meeting_room', label: 'Por sala' },
    { id: 'funciones', icono: 'schedule', label: 'Funciones' },
    { id: 'pagos', icono: 'payments', label: 'Métodos de pago' },
  ];

  readonly tabActivo = signal<TabId>('ventas-diarias');
  readonly cargando = signal(false);
  readonly error = signal('');
  readonly pagina = signal(1);
  readonly pageSize = 8;

  readonly ventasDiarias = signal<VentaDiaria[]>([]);
  readonly ventasPelicula = signal<VentaPelicula[]>([]);
  readonly ventasSala = signal<VentaSala[]>([]);
  readonly ocupacionFunciones = signal<OcupacionFuncion[]>([]);
  readonly metodosPago = signal<MetodoPagoEstadistica[]>([]);

  readonly diasSeleccionados = signal(30);
  readonly soloVigentes = signal(false);

  readonly totalPeriodo = computed(() =>
    this.ventasDiarias().reduce((total, dia) => total + (Number(dia.ventas) || 0), 0)
  );
  readonly maxVentaDia = computed(() =>
    Math.max(...this.ventasDiarias().map((dia) => Number(dia.ventas) || 0), 1)
  );
  readonly maxVentaPelicula = computed(() =>
    Math.max(...this.ventasPelicula().map((item) => Number(item.totalVentas) || 0), 1)
  );

  readonly datasetActivo = computed(() => {
    switch (this.tabActivo()) {
      case 'ventas-diarias':
        return this.ventasDiarias().length;
      case 'peliculas':
        return this.ventasPelicula().length;
      case 'salas':
        return this.ventasSala().length;
      case 'funciones':
        return this.ocupacionFunciones().length;
      case 'pagos':
        return this.metodosPago().length;
    }
  });

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.datasetActivo() / this.pageSize))
  );

  readonly rangoDesde = computed(() => {
    if (!this.datasetActivo()) return 0;
    return (this.pagina() - 1) * this.pageSize + 1;
  });

  readonly rangoHasta = computed(() =>
    Math.min(this.pagina() * this.pageSize, this.datasetActivo())
  );

  readonly ventasDiariasPagina = computed(() => this.slicePagina(this.ventasDiarias()));
  readonly ventasPeliculaPagina = computed(() => this.slicePagina(this.ventasPelicula()));
  readonly ventasSalaPagina = computed(() => this.slicePagina(this.ventasSala()));
  readonly ocupacionFuncionesPagina = computed(() => this.slicePagina(this.ocupacionFunciones()));
  readonly metodosPagoPagina = computed(() => this.slicePagina(this.metodosPago()));

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab') as TabId | null;
    const valido = !!tab && this.tabs.some((t) => t.id === tab);
    this.tabActivo.set(valido ? tab! : 'ventas-diarias');
    this.cargarTab(this.tabActivo());
  }

  cambiarTab(id: TabId): void {
    this.tabActivo.set(id);
    this.pagina.set(1);
    this.cargarTab(id);
  }

  recargarTab(): void {
    this.cargarTab(this.tabActivo());
  }

  cambiarPeriodo(dias: number): void {
    this.diasSeleccionados.set(dias);
    this.pagina.set(1);
    this.cargarVentasDiarias();
  }

  cambiarSoloVigentes(valor: boolean): void {
    this.soloVigentes.set(valor);
    this.pagina.set(1);
    this.cargarOcupacionFunciones();
  }

  irAPagina(page: number): void {
    const total = this.totalPaginas();
    if (page < 1 || page > total) return;
    this.pagina.set(page);
  }

  indiceAbsoluto(indiceLocal: number): number {
    return (this.pagina() - 1) * this.pageSize + indiceLocal + 1;
  }

  anchoBarra(valor: number, maximo: number): number {
    const v = Number(valor) || 0;
    const m = Number(maximo) || 1;
    if (!isFinite(m) || m <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((v / m) * 100)));
  }

  sumar(campo: 'reservas' | 'entradas' | 'ventas'): number {
    return this.ventasDiarias().reduce((total, dia) => total + (Number(dia[campo]) || 0), 0);
  }

  iconoPago(metodo: string): string {
    switch (metodo) {
      case 'EFECTIVO': return 'payments';
      case 'TARJETA': return 'credit_card';
      case 'MERCADO_PAGO': return 'phone_android';
      case 'TRANSFERENCIA': return 'account_balance';
      default: return 'receipt_long';
    }
  }

  etiquetaPago(metodo: string): string {
    return metodo.replace(/_/g, ' ');
  }

  // ------------------------------------------------------------------ privados

  private slicePagina<T>(items: T[]): T[] {
    const start = (this.pagina() - 1) * this.pageSize;
    return items.slice(start, start + this.pageSize);
  }

  private cargarTab(id: TabId): void {
    switch (id) {
      case 'ventas-diarias':
        this.cargarVentasDiarias();
        break;
      case 'peliculas':
        this.cargar(() => this.estadisticas.ventasPorPelicula(), this.ventasPelicula);
        break;
      case 'salas':
        this.cargar(() => this.estadisticas.ventasPorSala(), this.ventasSala);
        break;
      case 'funciones':
        this.cargarOcupacionFunciones();
        break;
      case 'pagos':
        this.cargar(() => this.estadisticas.metodosPago(), this.metodosPago);
        break;
    }
  }

  private cargarVentasDiarias(): void {
    this.cargar(() => this.estadisticas.ventasPorFecha(this.diasSeleccionados()), this.ventasDiarias);
  }

  private cargarOcupacionFunciones(): void {
    this.cargar(() => this.estadisticas.ocupacionFunciones(this.soloVigentes()), this.ocupacionFunciones);
  }

  private cargar<T>(
    origen: () => Observable<T[]>,
    destino: { set(valor: T[]): void }
  ): void {
    this.cargando.set(true);
    this.error.set('');
    origen()
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (datos) => {
          destino.set(datos ?? []);
          this.ajustarPagina();
        },
        error: (error) => this.error.set(getErrorMessage(error, 'No se pudieron cargar los datos.')),
      });
  }

  private ajustarPagina(): void {
    const total = this.totalPaginas();
    if (this.pagina() > total) {
      this.pagina.set(total);
    }
  }
}

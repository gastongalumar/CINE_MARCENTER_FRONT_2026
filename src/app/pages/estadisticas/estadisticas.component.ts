import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize, Observable } from 'rxjs';

import { EstadisticasService } from '../../services/estadisticas.service';
import {
  MetodoPagoEstadistica,
  OcupacionFuncion,
  VentaDiaria,
  VentaPelicula,
  VentaSala,
} from '../../models/estadisticas.model';
import { getErrorMessage } from '../../utils/api-error.util';
import { FechaApiPipe } from '../../pipes/fecha-api.pipe';

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
  templateUrl: './estadisticas.component.html',
  styleUrls: ['./estadisticas.component.css'],
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

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab') as TabId | null;
    const valido = !!tab && this.tabs.some((t) => t.id === tab);
    this.tabActivo.set(valido ? tab! : 'ventas-diarias');
    this.cargarTab(this.tabActivo());
  }

  cambiarTab(id: TabId): void {
    this.tabActivo.set(id);
    this.cargarTab(id);
  }

  recargarTab(): void {
    this.cargarTab(this.tabActivo());
  }

  cambiarPeriodo(dias: number): void {
    this.diasSeleccionados.set(dias);
    this.cargarVentasDiarias();
  }

  cambiarSoloVigentes(valor: boolean): void {
    this.soloVigentes.set(valor);
    this.cargarOcupacionFunciones();
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
        next: (datos) => destino.set(datos ?? []),
        error: (error) => this.error.set(getErrorMessage(error, 'No se pudieron cargar los datos.')),
      });
  }
}

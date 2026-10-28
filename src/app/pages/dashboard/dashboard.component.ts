import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { catchError, forkJoin, of } from 'rxjs';

import { EstadisticasService } from '../../services/estadisticas.service';
import {
  DashboardResumen,
  VentaDiaria,
  VentaPelicula,
  VentaSala,
} from '../../models/estadisticas.model';
import { getErrorMessage } from '../../utils/api-error.util';

/**
 * Panel principal del administrador. Muestra los KPI del resumen y tres
 * gráficos (ventas por película, ocupación por sala e ingresos por día).
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, BaseChartDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  private readonly estadisticas = inject(EstadisticasService);

  readonly resumen = signal<DashboardResumen | null>(null);
  readonly ventasPorPelicula = signal<VentaPelicula[]>([]);
  readonly ventasPorSala = signal<VentaSala[]>([]);
  readonly ventasPorDia = signal<VentaDiaria[]>([]);

  readonly cargando = signal(true);
  readonly errorMensaje = signal('');
  readonly dias = signal(30);

  /** Etiquetas cortas para el eje X de ingresos por día. */
  readonly etiquetasDias = computed(() =>
    this.ventasPorDia().map((dia) => this.formatearDiaCorto(dia.fecha))
  );

  readonly ingresosTotalesPeriodo = computed(() =>
    this.ventasPorDia().reduce((total, dia) => total + (Number(dia.ventas) || 0), 0)
  );

  private readonly opcionesBase: ChartOptions<'bar' | 'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 450 },
    plugins: {
      legend: {
        labels: { color: '#cbd5e1', font: { size: 12 } },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(245, 197, 24, 0.35)',
        borderWidth: 1,
        titleColor: '#f5c518',
        bodyColor: '#e2e8f0',
        padding: 10,
      },
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8', font: { size: 11 } },
        grid: { color: 'rgba(148, 163, 184, 0.08)' },
        border: { color: 'rgba(148, 163, 184, 0.2)' },
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#94a3b8', font: { size: 11 } },
        grid: { color: 'rgba(148, 163, 184, 0.08)' },
        border: { color: 'rgba(148, 163, 184, 0.2)' },
      },
    },
  };

  readonly chartPeliculas = computed<ChartConfiguration<'bar'>>(() => {
    const datos = [...this.ventasPorPelicula()]
      .sort((a, b) => b.totalVentas - a.totalVentas)
      .slice(0, 8);

    return {
      type: 'bar',
      data: {
        labels: datos.map((d) => d.peliculaNombre),
        datasets: [
          {
            label: 'Ventas ($)',
            data: datos.map((d) => Number(d.totalVentas) || 0),
            backgroundColor: 'rgba(245, 197, 24, 0.72)',
            hoverBackgroundColor: 'rgba(245, 197, 24, 0.95)',
            borderColor: '#f5c518',
            borderWidth: 1,
            borderRadius: 6,
            maxBarThickness: 46,
          },
        ],
      },
      options: {
        ...this.opcionesBase,
        plugins: {
          ...this.opcionesBase.plugins,
          legend: { display: false },
        },
      } as ChartOptions<'bar'>,
    };
  });

  readonly chartSalas = computed<ChartConfiguration<'bar'>>(() => {
    const datos = [...this.ventasPorSala()].sort((a, b) => b.pctOcupacion - a.pctOcupacion);

    return {
      type: 'bar',
      data: {
        labels: datos.map((d) => d.salaNombre),
        datasets: [
          {
            label: 'Ocupación (%)',
            data: datos.map((d) => Number(d.pctOcupacion) || 0),
            backgroundColor: datos.map((d) =>
              d.pctOcupacion >= 70
                ? 'rgba(34, 197, 94, 0.72)'
                : d.pctOcupacion >= 40
                  ? 'rgba(245, 197, 24, 0.72)'
                  : 'rgba(248, 113, 113, 0.72)'
            ),
            borderColor: datos.map((d) =>
              d.pctOcupacion >= 70 ? '#22c55e' : d.pctOcupacion >= 40 ? '#f5c518' : '#f87171'
            ),
            borderWidth: 1,
            borderRadius: 6,
            maxBarThickness: 46,
          },
        ],
      },
      options: {
        ...this.opcionesBase,
        indexAxis: 'y',
        plugins: {
          ...this.opcionesBase.plugins,
          legend: { display: false },
          tooltip: {
            ...this.opcionesBase.plugins?.tooltip,
            callbacks: {
              label: (context) => {
                const sala = datos[context.dataIndex];
                return ` ${context.parsed.x}% · ${sala?.totalEntradas ?? 0} entradas`;
              },
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            ticks: { color: '#94a3b8', callback: (valor) => `${valor}%` },
            grid: { color: 'rgba(148, 163, 184, 0.08)' },
            border: { color: 'rgba(148, 163, 184, 0.2)' },
          },
          y: {
            ticks: { color: '#94a3b8', font: { size: 11 } },
            grid: { color: 'rgba(148, 163, 184, 0.06)' },
            border: { color: 'rgba(148, 163, 184, 0.2)' },
          },
        },
      } as ChartOptions<'bar'>,
    };
  });

  readonly chartIngresos = computed<ChartConfiguration<'line'>>(() => ({
    type: 'line',
    data: {
      labels: this.etiquetasDias(),
      datasets: [
        {
          label: 'Ingresos ($)',
          data: this.ventasPorDia().map((d) => Number(d.ventas) || 0),
          borderColor: '#22d3ee',
          backgroundColor: 'rgba(34, 211, 238, 0.16)',
          pointBackgroundColor: '#22d3ee',
          pointBorderColor: '#0d121f',
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.35,
          fill: true,
        },
      ],
    },
    options: {
      ...this.opcionesBase,
      plugins: {
        ...this.opcionesBase.plugins,
        legend: { display: false },
      },
    } as ChartOptions<'line'>,
  }));

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando.set(true);
    this.errorMensaje.set('');

    forkJoin({
      resumen: this.estadisticas.resumen().pipe(catchError(() => of(null))),
      peliculas: this.estadisticas.ventasPorPelicula().pipe(catchError(() => of([]))),
      salas: this.estadisticas.ventasPorSala().pipe(catchError(() => of([]))),
      dias: this.estadisticas.ventasPorFecha(this.dias()).pipe(catchError(() => of([]))),
    }).subscribe({
      next: (datos) => {
        this.resumen.set(datos.resumen);
        this.ventasPorPelicula.set(datos.peliculas);
        this.ventasPorSala.set(datos.salas);
        this.ventasPorDia.set(datos.dias);
        this.cargando.set(false);

        if (!datos.resumen && !datos.peliculas.length && !datos.salas.length && !datos.dias.length) {
          this.errorMensaje.set('No se pudieron obtener los datos del panel.');
        }
      },
      error: (error) => {
        this.errorMensaje.set(getErrorMessage(error, 'No se pudo cargar el panel.'));
        this.cargando.set(false);
      },
    });
  }

  cambiarPeriodo(dias: number): void {
    if (dias === this.dias()) return;
    this.dias.set(dias);
    this.estadisticas.ventasPorFecha(dias).subscribe({
      next: (datos) => this.ventasPorDia.set(datos),
      error: () => this.errorMensaje.set('No se pudo actualizar el período de ingresos.'),
    });
  }

  formatoMoneda(valor: number | null | undefined): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(Number(valor) || 0);
  }

  private formatearDiaCorto(fecha: string): string {
    if (!fecha) return '';
    const partes = fecha.split('-');
    if (partes.length !== 3) return fecha;
    return `${partes[2]}/${partes[1]}`;
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { SalaService } from '../../services/sala';
import { ConfirmDialogService } from '../../services/confirm-dialog';
import { Sala } from '../../models/sala';
import { getErrorMessage } from '../../utils/api-error';

@Component({
  selector: 'app-listado-salas',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './listado-salas.html',
  styleUrls: ['../../styles/admin-panel.shared.css', './listado-salas.css'],
})
export class ListadoSalasComponent {
  private readonly salaService = inject(SalaService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);

  readonly salas = signal<Sala[]>([]);
  readonly cargando = signal(true);
  readonly errorCarga = signal('');
  readonly filtroNombre = signal('');
  readonly filtroCapacidad = signal<number | null>(null);
  readonly pagina = signal(1);
  readonly pageSize = 6;

  readonly nombresOpciones = computed(() =>
    [...new Set(this.salas().map((s) => s.nombre).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, 'es')
    )
  );

  readonly capacidadesOpciones = computed(() =>
    [...new Set(this.salas().map((s) => this.capacidadDe(s)))].sort((a, b) => a - b)
  );

  readonly hayFiltrosActivos = computed(
    () => !!this.filtroNombre() || this.filtroCapacidad() !== null
  );

  readonly salasFiltradas = computed(() => {
    const nombre = this.filtroNombre();
    const capacidad = this.filtroCapacidad();

    return this.salas().filter((s) => {
      if (nombre && s.nombre !== nombre) return false;
      if (capacidad !== null && this.capacidadDe(s) !== capacidad) return false;
      return true;
    });
  });

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.salasFiltradas().length / this.pageSize))
  );

  readonly salasPagina = computed(() => {
    const start = (this.pagina() - 1) * this.pageSize;
    return this.salasFiltradas().slice(start, start + this.pageSize);
  });

  readonly rangoDesde = computed(() => {
    if (!this.salasFiltradas().length) return 0;
    return (this.pagina() - 1) * this.pageSize + 1;
  });

  readonly rangoHasta = computed(() =>
    Math.min(this.pagina() * this.pageSize, this.salasFiltradas().length)
  );

  private readonly initLoad = afterNextRender(() => this.cargarSalas());

  cargarSalas(): void {
    this.cargando.set(true);
    this.salaService.listarTodas({ skipErrorToast: true }).subscribe({
      next: (salas) => {
        this.salas.set(salas);
        this.ajustarPagina();
        this.cargando.set(false);
      },
      error: (error) => {
        this.errorCarga.set(getErrorMessage(error, 'No se pudieron cargar las salas.'));
        this.cargando.set(false);
      },
    });
  }

  actualizarFiltroNombre(valor: string): void {
    this.filtroNombre.set(valor);
    this.pagina.set(1);
  }

  actualizarFiltroCapacidad(valor: string): void {
    this.filtroCapacidad.set(valor === '' ? null : Number(valor));
    this.pagina.set(1);
  }

  limpiarFiltros(): void {
    this.filtroNombre.set('');
    this.filtroCapacidad.set(null);
    this.pagina.set(1);
  }

  irAPagina(page: number): void {
    const total = this.totalPaginas();
    if (page < 1 || page > total) return;
    this.pagina.set(page);
  }

  editar(sala: Sala): void {
    if (!sala.id) return;
    void this.router.navigate(['/admin/salas'], { queryParams: { id: sala.id } });
  }

  eliminar(sala: Sala): void {
    if (!sala.id) return;

    this.confirmDialog
      .confirmDanger(
        'Eliminar sala',
        `¿Seguro que querés eliminar «${sala.nombre}»? También se perderán sus butacas y funciones asociadas.`
      )
      .subscribe((confirmado) => {
        if (!confirmado) return;

        this.salaService.eliminar(sala.id!).subscribe({
          next: () => {
            this.toastr.success('Sala eliminada', 'Éxito');
            this.cargarSalas();
          },
        });
      });
  }

  capacidadDe(sala: Sala): number {
    return sala.capacidad ?? sala.filas * sala.columnas;
  }

  private ajustarPagina(): void {
    const total = this.totalPaginas();
    if (this.pagina() > total) {
      this.pagina.set(total);
    }
  }
}

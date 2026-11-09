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
  styleUrls: ['./listado-salas.css'],
})
export class ListadoSalasComponent {
  private readonly salaService = inject(SalaService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);

  readonly salas = signal<Sala[]>([]);
  readonly cargando = signal(true);
  readonly errorCarga = signal('');
  readonly pagina = signal(1);
  readonly pageSize = 6;

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.salas().length / this.pageSize))
  );

  readonly salasPagina = computed(() => {
    const start = (this.pagina() - 1) * this.pageSize;
    return this.salas().slice(start, start + this.pageSize);
  });

  readonly rangoDesde = computed(() => {
    if (!this.salas().length) return 0;
    return (this.pagina() - 1) * this.pageSize + 1;
  });

  readonly rangoHasta = computed(() =>
    Math.min(this.pagina() * this.pageSize, this.salas().length)
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

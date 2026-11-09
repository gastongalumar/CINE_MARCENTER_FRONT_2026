import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { FuncionService } from '../../services/funcion';
import { ConfirmDialogService } from '../../services/confirm-dialog';
import { Funcion } from '../../models/funcion';
import { getErrorMessage } from '../../utils/api-error';
import { FechaApiPipe } from '../../pipes/fecha-api';
import { parseApiDateTime } from '../../utils/datetime';

@Component({
  selector: 'app-listado-funciones',
  standalone: true,
  imports: [CommonModule, RouterModule, FechaApiPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './listado-funciones.html',
  styleUrls: ['./listado-funciones.css'],
})
export class ListadoFuncionesComponent {
  private readonly funcionService = inject(FuncionService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toastr = inject(ToastrService);

  readonly funciones = signal<Funcion[]>([]);
  readonly cargando = signal(true);
  readonly soloVigentes = signal(false);
  readonly pagina = signal(1);
  readonly pageSize = 6;
  readonly errorCarga = signal('');

  readonly funcionesFiltradas = computed(() => {
    if (!this.soloVigentes()) return this.funciones();
    return this.funciones().filter((f) => this.esVigente(f));
  });

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.funcionesFiltradas().length / this.pageSize))
  );

  readonly funcionesPagina = computed(() => {
    const start = (this.pagina() - 1) * this.pageSize;
    return this.funcionesFiltradas().slice(start, start + this.pageSize);
  });

  readonly rangoDesde = computed(() => {
    if (!this.funcionesFiltradas().length) return 0;
    return (this.pagina() - 1) * this.pageSize + 1;
  });

  readonly rangoHasta = computed(() =>
    Math.min(this.pagina() * this.pageSize, this.funcionesFiltradas().length)
  );

  private readonly initLoad = afterNextRender(() => this.cargarFunciones());

  cargarFunciones(): void {
    this.cargando.set(true);
    this.errorCarga.set('');

    this.funcionService.listarTodas({ skipErrorToast: true }).subscribe({
      next: (funciones) => {
        this.funciones.set(funciones);
        this.ajustarPagina();
        this.cargando.set(false);
      },
      error: (error) => {
        this.errorCarga.set(getErrorMessage(error, 'No se pudieron cargar las funciones.'));
        this.cargando.set(false);
      },
    });
  }

  actualizarSoloVigentes(valor: boolean): void {
    this.soloVigentes.set(valor);
    this.pagina.set(1);
  }

  irAPagina(page: number): void {
    const total = this.totalPaginas();
    if (page < 1 || page > total) return;
    this.pagina.set(page);
  }

  eliminarFuncion(funcion: Funcion): void {
    if (!funcion.id) return;

    this.confirmDialog
      .confirmDanger(
        'Eliminar función',
        `¿Seguro que querés eliminar la función de «${funcion.peliculaNombre ?? 'la película'}» en ` +
          `${funcion.salaNombre ?? 'la sala'}? Se eliminarán también sus reservas asociadas.`
      )
      .subscribe((confirmado) => {
        if (!confirmado) return;

        this.funcionService.eliminar(funcion.id!).subscribe({
          next: () => {
            this.toastr.success('Función eliminada', 'Éxito');
            this.cargarFunciones();
          },
        });
      });
  }

  esVigente(funcion: Funcion): boolean {
    const fecha = parseApiDateTime(funcion.horario);
    return !!fecha && fecha.getTime() >= Date.now();
  }

  private ajustarPagina(): void {
    const total = this.totalPaginas();
    if (this.pagina() > total) {
      this.pagina.set(total);
    }
  }
}

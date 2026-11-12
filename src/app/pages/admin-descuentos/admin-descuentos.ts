import { Component, ChangeDetectionStrategy, ChangeDetectorRef, afterNextRender, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CodigoDescuentoService } from '../../services/codigo-descuento';
import { CodigoDescuento } from '../../models/codigo-descuento';
import { refreshView } from '../../utils/refresh-view';

@Component({
  selector: 'app-admin-descuentos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-descuentos.html',
  styleUrls: ['../../styles/admin-panel.shared.css'],
})
export class AdminDescuentosComponent {
  private readonly service = inject(CodigoDescuentoService);
  private readonly toastr = inject(ToastrService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  private readonly init = afterNextRender(() => this.cargar());

  codigos: CodigoDescuento[] = [];
  cargando = true;

  cargar(): void {
    this.cargando = true;
    this.service.listar().subscribe({
      next: (data) => {
        this.codigos = data;
        this.cargando = false;
        refreshView(this.cdr);
      },
      error: () => {
        this.cargando = false;
        refreshView(this.cdr);
      },
    });
  }

  nuevo(): void {
    void this.router.navigate(['/admin/descuentos/nuevo']);
  }

  editar(item: CodigoDescuento): void {
    void this.router.navigate(['/admin/descuentos', item.id]);
  }

  eliminar(item: CodigoDescuento): void {
    if (!confirm(`¿Eliminar código ${item.codigo}?`)) return;
    this.service.eliminar(item.id).subscribe({
      next: () => {
        this.toastr.success('Código eliminado');
        this.cargar();
      },
    });
  }

  etiquetaValor(item: CodigoDescuento): string {
    return item.tipo === 'PORCENTAJE' ? `${item.valor}%` : `$ ${item.valor}`;
  }
}

import { Component, ChangeDetectionStrategy, ChangeDetectorRef, afterNextRender, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CandyComboService } from '../../services/candy-combo';
import { CandyCombo } from '../../models/candy-combo';
import { refreshView } from '../../utils/refresh-view';

@Component({
  selector: 'app-admin-candy',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-candy.html',
  styleUrls: ['../../styles/admin-panel.shared.css', './admin-candy.css'],
})
export class AdminCandyComponent {
  private readonly service = inject(CandyComboService);
  private readonly toastr = inject(ToastrService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  private readonly init = afterNextRender(() => this.cargar());

  combos: CandyCombo[] = [];
  cargando = true;

  cargar(): void {
    this.cargando = true;
    this.service.listarTodos().subscribe({
      next: (data) => {
        this.combos = data;
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
    void this.router.navigate(['/admin/candy/nuevo']);
  }

  editar(combo: CandyCombo): void {
    void this.router.navigate(['/admin/candy', combo.id]);
  }

  eliminar(combo: CandyCombo): void {
    if (!confirm(`¿Eliminar "${combo.nombre}"?`)) return;
    this.service.eliminar(combo.id).subscribe({
      next: () => {
        this.toastr.success('Combo eliminado');
        this.cargar();
      },
    });
  }
}

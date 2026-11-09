import { Component, ChangeDetectionStrategy, ChangeDetectorRef, afterNextRender, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CandyComboService } from '../../services/candy-combo';
import { CandyCombo } from '../../models/candy-combo';
import { refreshView } from '../../utils/refresh-view';

@Component({
  selector: 'app-candy',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './candy.html',
  styleUrls: ['./cumpleanos.css'],
})
export class CandyComponent {
  private readonly service = inject(CandyComboService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly init = afterNextRender(() => this.cargar());

  combos: CandyCombo[] = [];
  cargando = true;

  cargar(): void {
    this.service.listarActivos().subscribe({
      next: (data) => {
        this.combos = data;
        this.cargando = false;
        refreshView(this.cdr);
      },
      error: () => {
        this.combos = [];
        this.cargando = false;
        refreshView(this.cdr);
      },
    });
  }
}

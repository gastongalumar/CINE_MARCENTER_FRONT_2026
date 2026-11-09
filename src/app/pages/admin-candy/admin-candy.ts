import { Component, ChangeDetectionStrategy, ChangeDetectorRef, afterNextRender, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CandyComboService } from '../../services/candy-combo';
import { CandyCombo } from '../../models/candy-combo';
import { getErrorMessage } from '../../utils/api-error';
import { refreshView } from '../../utils/refresh-view';

@Component({
  selector: 'app-admin-candy',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-candy.html',
  styleUrls: ['./admin-candy.css'],
})
export class AdminCandyComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CandyComboService);
  private readonly toastr = inject(ToastrService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly init = afterNextRender(() => this.cargar());

  combos: CandyCombo[] = [];
  cargando = true;
  guardando = false;
  editandoId: number | null = null;

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(80)]],
    descripcion: [''],
    precio: [4500, [Validators.required, Validators.min(1)]],
    icono: ['fastfood'],
    activo: [true],
  });

  cargar(): void {
    this.cargando = true;
    this.service.listarTodos().subscribe({
      next: (data) => {
        this.combos = data;
        this.cargando = false;
        refreshView(this.cdr);
      },
      error: (err) => {
        this.cargando = false;
        this.toastr.error(getErrorMessage(err, 'No se pudieron cargar los combos'));
        refreshView(this.cdr);
      },
    });
  }

  nuevo(): void {
    this.editandoId = null;
    this.form.reset({ nombre: '', descripcion: '', precio: 4500, icono: 'fastfood', activo: true });
    refreshView(this.cdr);
  }

  editar(combo: CandyCombo): void {
    this.editandoId = combo.id;
    this.form.setValue({
      nombre: combo.nombre,
      descripcion: combo.descripcion || '',
      precio: combo.precio,
      icono: combo.icono || 'fastfood',
      activo: combo.activo,
    });
    refreshView(this.cdr);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando = true;
    const raw = this.form.getRawValue();
    const payload = {
      nombre: raw.nombre.trim(),
      descripcion: raw.descripcion.trim() || undefined,
      precio: Number(raw.precio),
      icono: raw.icono.trim() || 'fastfood',
      activo: raw.activo,
    };
    const req$ =
      this.editandoId == null
        ? this.service.crear(payload)
        : this.service.actualizar(this.editandoId, payload);

    req$.subscribe({
      next: () => {
        this.guardando = false;
        this.toastr.success(this.editandoId == null ? 'Combo creado' : 'Combo actualizado');
        this.nuevo();
        this.cargar();
      },
      error: (err) => {
        this.guardando = false;
        this.toastr.error(getErrorMessage(err, 'No se pudo guardar'));
        refreshView(this.cdr);
      },
    });
  }

  eliminar(combo: CandyCombo): void {
    if (!confirm(`¿Eliminar "${combo.nombre}"?`)) return;
    this.service.eliminar(combo.id).subscribe({
      next: () => {
        this.toastr.success('Combo eliminado');
        if (this.editandoId === combo.id) this.nuevo();
        this.cargar();
      },
      error: (err) => this.toastr.error(getErrorMessage(err, 'No se pudo eliminar')),
    });
  }
}

import { Component, ChangeDetectionStrategy, ChangeDetectorRef, afterNextRender, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CodigoDescuentoService } from '../../services/codigo-descuento';
import { CodigoDescuento, TipoDescuento } from '../../models/codigo-descuento';
import { getErrorMessage } from '../../utils/api-error';
import { refreshView } from '../../utils/refresh-view';

@Component({
  selector: 'app-admin-descuentos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-descuentos.html',
  styleUrls: ['../admin-candy/admin-candy.css'],
})
export class AdminDescuentosComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CodigoDescuentoService);
  private readonly toastr = inject(ToastrService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly init = afterNextRender(() => this.cargar());

  codigos: CodigoDescuento[] = [];
  cargando = true;
  guardando = false;
  editandoId: number | null = null;

  readonly form = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, Validators.maxLength(40)]],
    tipo: ['PORCENTAJE' as TipoDescuento, Validators.required],
    valor: [10, [Validators.required, Validators.min(0.01)]],
    usosMaximos: [null as number | null],
    descripcion: [''],
    activo: [true],
  });

  cargar(): void {
    this.cargando = true;
    this.service.listar().subscribe({
      next: (data) => {
        this.codigos = data;
        this.cargando = false;
        refreshView(this.cdr);
      },
      error: (err) => {
        this.cargando = false;
        this.toastr.error(getErrorMessage(err, 'No se pudieron cargar los códigos'));
        refreshView(this.cdr);
      },
    });
  }

  nuevo(): void {
    this.editandoId = null;
    this.form.reset({
      codigo: '',
      tipo: 'PORCENTAJE',
      valor: 10,
      usosMaximos: null,
      descripcion: '',
      activo: true,
    });
    refreshView(this.cdr);
  }

  editar(item: CodigoDescuento): void {
    this.editandoId = item.id;
    this.form.setValue({
      codigo: item.codigo,
      tipo: item.tipo,
      valor: item.valor,
      usosMaximos: item.usosMaximos ?? null,
      descripcion: item.descripcion || '',
      activo: item.activo,
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
      codigo: raw.codigo.trim().toUpperCase(),
      tipo: raw.tipo,
      valor: Number(raw.valor),
      usosMaximos: (() => {
        const n = Number(raw.usosMaximos);
        return raw.usosMaximos == null || Number.isNaN(n) || n <= 0 ? null : n;
      })(),
      descripcion: raw.descripcion.trim() || undefined,
      activo: raw.activo,
    };

    const req$ =
      this.editandoId == null
        ? this.service.crear(payload)
        : this.service.actualizar(this.editandoId, payload);

    req$.subscribe({
      next: () => {
        this.guardando = false;
        this.toastr.success(this.editandoId == null ? 'Código creado' : 'Código actualizado');
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

  eliminar(item: CodigoDescuento): void {
    if (!confirm(`¿Eliminar código ${item.codigo}?`)) return;
    this.service.eliminar(item.id).subscribe({
      next: () => {
        this.toastr.success('Código eliminado');
        if (this.editandoId === item.id) this.nuevo();
        this.cargar();
      },
      error: (err) => this.toastr.error(getErrorMessage(err, 'No se pudo eliminar')),
    });
  }

  etiquetaValor(item: CodigoDescuento): string {
    return item.tipo === 'PORCENTAJE' ? `${item.valor}%` : `$ ${item.valor}`;
  }
}

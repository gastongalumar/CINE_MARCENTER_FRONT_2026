import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  afterNextRender,
  inject,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { CodigoDescuentoService } from '../../services/codigo-descuento';
import { TipoDescuento } from '../../models/codigo-descuento';
import { refreshView } from '../../utils/refresh-view';

@Component({
  selector: 'app-admin-descuento-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-descuento-form.html',
  styleUrls: ['../../styles/admin-panel.shared.css'],
})
export class AdminDescuentoFormComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CodigoDescuentoService);
  private readonly toastr = inject(ToastrService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private formSub: Subscription | null = null;

  private readonly init = afterNextRender(() => {
    this.formSub = this.form.statusChanges.subscribe(() => refreshView(this.cdr));
    this.form.controls.tipo.valueChanges.subscribe((tipo) => {
      this.actualizarValidadoresValor(tipo);
    });
    this.actualizarValidadoresValor(this.form.controls.tipo.value);

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      if (!Number.isNaN(id) && id > 0) {
        this.cargarParaEditar(id);
        return;
      }
    }
    this.cargando = false;
    refreshView(this.cdr);
  });

  editandoId: number | null = null;
  cargando = true;
  guardando = false;

  readonly form = this.fb.group({
    codigo: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(40)]),
    tipo: this.fb.nonNullable.control<TipoDescuento>('PORCENTAJE', Validators.required),
    valor: this.fb.nonNullable.control(10, [
      Validators.required,
      Validators.min(0.01),
      Validators.max(100),
    ]),
    usosMaximos: this.fb.control<number | null>(null),
    descripcion: this.fb.nonNullable.control(''),
    activo: this.fb.nonNullable.control(true),
  });

  get titulo(): string {
    return this.editandoId ? 'Editar código' : 'Nuevo código';
  }

  ngOnDestroy(): void {
    this.formSub?.unsubscribe();
  }

  /** Ajusta Validators.max(100) cuando el tipo es PORCENTAJE. */
  actualizarValidadoresValor(tipo: TipoDescuento): void {
    const validators = [Validators.required, Validators.min(0.01)];
    if (tipo === 'PORCENTAJE') {
      validators.push(Validators.max(100));
    }
    this.form.controls.valor.setValidators(validators);
    this.form.controls.valor.updateValueAndValidity({ emitEvent: false });
  }

  private cargarParaEditar(id: number): void {
    this.cargando = true;
    this.service.obtener(id).subscribe({
      next: (item) => {
        this.editandoId = item.id;
        this.form.setValue({
          codigo: item.codigo,
          tipo: item.tipo,
          valor: item.valor,
          usosMaximos: item.usosMaximos ?? null,
          descripcion: item.descripcion || '',
          activo: item.activo,
        });
        this.actualizarValidadoresValor(item.tipo);
        this.cargando = false;
        refreshView(this.cdr);
      },
      error: () => {
        void this.router.navigate(['/admin/descuentos']);
      },
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Completá el código y el valor para continuar.', 'Descuentos');
      refreshView(this.cdr);
      return;
    }

    this.guardando = true;
    refreshView(this.cdr);

    const raw = this.form.getRawValue();
    const usosRaw = raw.usosMaximos;
    const usosNum = usosRaw == null || usosRaw === ('' as unknown) ? NaN : Number(usosRaw);

    const payload = {
      codigo: (raw.codigo || '').trim().toUpperCase(),
      tipo: raw.tipo!,
      valor: Number(raw.valor),
      usosMaximos: Number.isNaN(usosNum) || usosNum <= 0 ? null : usosNum,
      descripcion: (raw.descripcion || '').trim() || undefined,
      activo: !!raw.activo,
    };

    const creando = this.editandoId == null;
    const req$ = creando
      ? this.service.crear(payload)
      : this.service.actualizar(this.editandoId!, payload);

    req$.subscribe({
      next: () => {
        this.guardando = false;
        this.toastr.success(creando ? 'Código creado' : 'Código actualizado');
        void this.router.navigate(['/admin/descuentos']);
      },
      error: () => {
        this.guardando = false;
        refreshView(this.cdr);
      },
    });
  }

  cancelar(): void {
    void this.router.navigate(['/admin/descuentos']);
  }
}

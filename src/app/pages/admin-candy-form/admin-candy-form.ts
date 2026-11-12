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
import { merge, Subscription } from 'rxjs';
import { CandyComboService } from '../../services/candy-combo';
import { esControlInvalido } from '../../utils/form-error';
import { refreshView } from '../../utils/refresh-view';

@Component({
  selector: 'app-admin-candy-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-candy-form.html',
  styleUrls: ['../../styles/admin-panel.shared.css'],
})
export class AdminCandyFormComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CandyComboService);
  private readonly toastr = inject(ToastrService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private formSub: Subscription | null = null;

  private readonly init = afterNextRender(() => {
    this.formSub = merge(this.form.statusChanges, this.form.valueChanges).subscribe(() =>
      refreshView(this.cdr)
    );
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

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(80)]],
    descripcion: [''],
    precio: [4500, [Validators.required, Validators.min(1)]],
    icono: ['fastfood'],
    activo: [true],
  });

  get titulo(): string {
    return this.editandoId ? 'Editar combo' : 'Nuevo combo';
  }

  esInvalido(campo: string): boolean {
    return esControlInvalido(this.form.get(campo));
  }

  ngOnDestroy(): void {
    this.formSub?.unsubscribe();
  }

  private cargarParaEditar(id: number): void {
    this.cargando = true;
    this.service.obtener(id).subscribe({
      next: (combo) => {
        this.editandoId = combo.id;
        this.form.setValue({
          nombre: combo.nombre,
          descripcion: combo.descripcion || '',
          precio: combo.precio,
          icono: combo.icono || 'fastfood',
          activo: combo.activo,
        });
        this.cargando = false;
        refreshView(this.cdr);
      },
      error: () => {
        void this.router.navigate(['/admin/candy']);
      },
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Completá los campos obligatorios.', 'Combos');
      refreshView(this.cdr);
      return;
    }

    this.guardando = true;
    refreshView(this.cdr);

    const raw = this.form.getRawValue();
    const payload = {
      nombre: raw.nombre.trim(),
      descripcion: raw.descripcion.trim() || undefined,
      precio: Number(raw.precio),
      icono: raw.icono.trim() || 'fastfood',
      activo: raw.activo,
    };

    const creando = this.editandoId == null;
    const req$ = creando
      ? this.service.crear(payload)
      : this.service.actualizar(this.editandoId!, payload);

    req$.subscribe({
      next: () => {
        this.guardando = false;
        this.toastr.success(creando ? 'Combo creado' : 'Combo actualizado');
        void this.router.navigate(['/admin/candy']);
      },
      error: () => {
        this.guardando = false;
        refreshView(this.cdr);
      },
    });
  }

  cancelar(): void {
    void this.router.navigate(['/admin/candy']);
  }
}

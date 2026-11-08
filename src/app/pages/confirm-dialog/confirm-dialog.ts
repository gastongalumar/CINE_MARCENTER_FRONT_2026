import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/** Datos que recibe el diálogo de confirmación. */
export interface ConfirmDialogData {
  /** Título del diálogo. */
  title: string;
  /** Texto explicativo de la acción a confirmar. */
  message: string;
  /** Etiqueta del botón de confirmación (por defecto "Confirmar"). */
  confirmText?: string;
  /** Etiqueta del botón de cancelación (por defecto "Cancelar"). */
  cancelText?: string;
  /** Nombre del icono de Material a mostrar. */
  icon?: string;
  /** true para mostrar la acción en color destructivo (rojo). */
  danger?: boolean;
}

/**
 * Diálogo de confirmación reutilizable (reemplaza a `window.confirm`).
 *
 * Se abre mediante `ConfirmDialogService.confirm(...)`, que devuelve un
 * `Observable<boolean>` con el resultado de la interacción.
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirm-dialog.html',
  styleUrls: ['./confirm-dialog.css'],
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent, boolean>);

  confirmar(): void {
    this.dialogRef.close(true);
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}

import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../pages/confirm-dialog/confirm-dialog.component';

/**
 * Servicio para pedir confirmación al usuario antes de una acción
 * destructiva. Reemplaza a `window.confirm` por un diálogo con el estilo
 * de la aplicación.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly dialog = inject(MatDialog);

  /**
   * Abre el diálogo de confirmación.
   * @returns `Observable<boolean>` que emite `true` si el usuario confirma.
   */
  confirm(data: ConfirmDialogData): Observable<boolean> {
    return this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        data,
        width: '460px',
        maxWidth: '94vw',
        autoFocus: false,
        restoreFocus: true,
        panelClass: 'cinemacenter-dialog',
      })
      .afterClosed()
      .pipe(map((result) => result === true));
  }

  /** Atajo para confirmaciones destructivas. */
  confirmDanger(title: string, message: string, confirmText = 'Eliminar'): Observable<boolean> {
    return this.confirm({ title, message, confirmText, danger: true, icon: 'delete_forever' });
  }
}

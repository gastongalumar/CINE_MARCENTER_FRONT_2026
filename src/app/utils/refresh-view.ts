import { ChangeDetectorRef } from '@angular/core';

/** Fuerza refresco de la UI tras actualizaciones async (zoneless + OnPush). */
export function refreshView(cdr: ChangeDetectorRef): void {
  cdr.markForCheck();
  setTimeout(() => cdr.detectChanges());
}

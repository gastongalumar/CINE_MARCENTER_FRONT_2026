import type { ChangeDetectorRef } from '@angular/core';

export function refreshView(cd?: ChangeDetectorRef | null): void {
  cd?.detectChanges();
}

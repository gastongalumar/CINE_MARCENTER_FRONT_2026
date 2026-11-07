import { ChangeDetectorRef } from '@angular/core';

export function refreshView(changeDetector: ChangeDetectorRef): void {
  changeDetector.detectChanges();
}

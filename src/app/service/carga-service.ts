import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CargaService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.loadingSubject.asObservable();

  // Counter of concurrent operations
  private counter = 0;
  // Delay before showing (ms) to avoid flicker on very fast ops
  private showDelayMs = 120;
  // Minimum time the splash must be visible (ms)
  private minVisibleMs = 600;

  private showTimeout: any = null;
  private hideTimeout: any = null;
  private shownAt = 0;

  show() {
    this.counter++;
    if (this.counter === 1) {
      // schedule show after a small delay to prevent flicker
      clearTimeout(this.showTimeout);
      this.showTimeout = setTimeout(() => {
        this.shownAt = Date.now();
        this.loadingSubject.next(true);
      }, this.showDelayMs);
    }
  }

  hide() {
    if (this.counter <= 0) return;
    this.counter--;
    if (this.counter === 0) {
      // cancel pending show if it wasn't fired
      clearTimeout(this.showTimeout);

      const elapsed = Date.now() - this.shownAt;
      const remaining = Math.max(0, this.minVisibleMs - elapsed);
      clearTimeout(this.hideTimeout);
      this.hideTimeout = setTimeout(() => {
        this.loadingSubject.next(false);
        this.shownAt = 0;
      }, remaining);
    }
  }

  // Force hide immediately (useful on critical error)
  forceHide() {
    this.counter = 0;
    clearTimeout(this.showTimeout);
    clearTimeout(this.hideTimeout);
    this.loadingSubject.next(false);
    this.shownAt = 0;
  }
}

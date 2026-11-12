import { TestBed } from '@angular/core/testing';
import { LoadingService } from './loading';

describe('LoadingService', () => {
  let service: LoadingService;
  let values: boolean[];

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [LoadingService] });
    service = TestBed.inject(LoadingService);
    values = [];
    service.isLoading$.subscribe((v) => values.push(v));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('show demora showDelayMs antes de emitir true', () => {
    service.show();
    expect(values.at(-1)).toBe(false);
    vi.advanceTimersByTime(119);
    expect(values.at(-1)).toBe(false);
    vi.advanceTimersByTime(1);
    expect(values.at(-1)).toBe(true);
  });

  it('ops concurrentes: hide solo cuando counter llega a 0', () => {
    service.show();
    service.show();
    vi.advanceTimersByTime(120);
    expect(values.at(-1)).toBe(true);

    service.hide();
    vi.advanceTimersByTime(600);
    expect(values.at(-1)).toBe(true);

    service.hide();
    vi.advanceTimersByTime(600);
    expect(values.at(-1)).toBe(false);
  });

  it('hide antes del show cancela el splash', () => {
    service.show();
    service.hide();
    vi.advanceTimersByTime(1000);
    expect(values.filter((v) => v === true)).toEqual([]);
  });

  it('forceHide resetea de inmediato', () => {
    service.show();
    vi.advanceTimersByTime(120);
    expect(values.at(-1)).toBe(true);
    service.forceHide();
    expect(values.at(-1)).toBe(false);
  });
});

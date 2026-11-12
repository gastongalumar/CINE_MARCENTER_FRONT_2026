import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ConfirmDialogService } from './confirm-dialog';

describe('ConfirmDialogService', () => {
  let service: ConfirmDialogService;
  let open: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    open = vi.fn(() => ({ afterClosed: () => of(true) }));
    TestBed.configureTestingModule({
      providers: [
        ConfirmDialogService,
        { provide: MatDialog, useValue: { open } },
      ],
    });
    service = TestBed.inject(ConfirmDialogService);
  });

  it('confirm abre MatDialog y mapea true', () => {
    let result: boolean | undefined;
    service.confirm({ title: 'T', message: 'M' }).subscribe((v) => (result = v));
    expect(open).toHaveBeenCalledTimes(1);
    const [, config] = open.mock.calls[0];
    expect(config.data).toEqual({ title: 'T', message: 'M' });
    expect(config.width).toBe('400px');
    expect(result).toBe(true);
  });

  it('confirm mapea cierre no-true a false', () => {
    open.mockReturnValue({ afterClosed: () => of(undefined) });
    let result: boolean | undefined;
    service.confirm({ title: 'T', message: 'M' }).subscribe((v) => (result = v));
    expect(result).toBe(false);
  });

  it('confirmDanger fuerza danger + icon delete_forever', () => {
    service.confirmDanger('Borrar', 'Seguro?', 'Eliminar ya').subscribe();
    const [, config] = open.mock.calls[0];
    expect(config.data).toEqual({
      title: 'Borrar',
      message: 'Seguro?',
      confirmText: 'Eliminar ya',
      danger: true,
      icon: 'delete_forever',
    });
  });
});

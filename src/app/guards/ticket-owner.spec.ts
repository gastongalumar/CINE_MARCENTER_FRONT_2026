import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { of, throwError, firstValueFrom } from 'rxjs';
import { ticketOwnerGuard } from './ticket-owner';
import { AuthService } from '../services/auth';
import { ReservaService } from '../services/reserva';
import { createRouterMock, createToastrMock } from '../../testing/router-mocks';

describe('ticketOwnerGuard', () => {
  const router = createRouterMock();
  const toastr = createToastrMock();
  let obtenerPorTicket: ReturnType<typeof vi.fn>;
  let getUserId: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    obtenerPorTicket = vi.fn();
    getUserId = vi.fn(() => 7);
    toastr.warning.mockClear();
    router.createUrlTree.mockClear();

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: ToastrService, useValue: toastr },
        { provide: AuthService, useValue: { getUserId } },
        { provide: ReservaService, useValue: { obtenerPorTicket } },
      ],
    });
  });

  function run(numero: string | null) {
    const route = {
      paramMap: {
        get: (key: string) => (key === 'numero' ? numero : null),
      },
    } as never;
    return TestBed.runInInjectionContext(() => ticketOwnerGuard(route, {} as never));
  }

  it('permite al dueño del ticket', async () => {
    obtenerPorTicket.mockReturnValue(of({ numeroTicket: 'TK1', clienteId: 7 }));
    const result = await firstValueFrom(run('TK1') as ReturnType<typeof of>);
    expect(result).toBe(true);
    expect(obtenerPorTicket).toHaveBeenCalledWith('TK1', { skipErrorToast: true });
    expect(toastr.warning).not.toHaveBeenCalled();
  });

  it('otro cliente con el mismo ticket → mis-reservas', async () => {
    obtenerPorTicket.mockReturnValue(of({ numeroTicket: 'TK1', clienteId: 99 }));
    const result = (await firstValueFrom(run('TK1') as ReturnType<typeof of>)) as UrlTree & {
      commands: unknown[];
    };
    expect(result.commands).toEqual(['/mis-reservas']);
    expect(obtenerPorTicket).toHaveBeenCalledWith('TK1', { skipErrorToast: true });
    expect(toastr.warning).toHaveBeenCalledTimes(1);
    expect(toastr.warning).toHaveBeenCalledWith('No encontramos ese ticket.', 'Ticket');
  });

  it('ticket inexistente → un solo warning y mis-reservas', async () => {
    obtenerPorTicket.mockReturnValue(throwError(() => ({ status: 404 })));
    const result = (await firstValueFrom(run('TK404') as ReturnType<typeof of>)) as UrlTree & {
      commands: unknown[];
    };
    expect(result.commands).toEqual(['/mis-reservas']);
    expect(obtenerPorTicket).toHaveBeenCalledWith('TK404', { skipErrorToast: true });
    expect(toastr.warning).toHaveBeenCalledTimes(1);
    expect(toastr.warning).toHaveBeenCalledWith('No encontramos ese ticket.', 'Ticket');
  });

  it('sin numero → mis-reservas', () => {
    const result = run(null) as UrlTree & { commands: unknown[] };
    expect(result.commands).toEqual(['/mis-reservas']);
  });
});

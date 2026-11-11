import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { ReservaService } from './reserva';
import { provideTestingHttp } from '../../testing/http-helpers';
import { environment } from '../../environments/environment';
import { SKIP_ERROR_TOAST } from '../utils/http.context';

describe('ReservaService', () => {
  let service: ReservaService;
  let http: HttpTestingController;
  const api = `${environment.apiUrl}/reservas`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTestingHttp(), ReservaService],
    });
    service = TestBed.inject(ReservaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('crearReserva POST', () => {
    const payload = {
      funcionId: 1,
      asientos: ['A1'],
      metodoPago: 'EFECTIVO',
    };
    service.crearReserva(payload as never).subscribe();
    const req = http.expectOne(api);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 1, numeroTicket: 'TK1' });
  });

  it('listarMisReservas GET /mis', () => {
    service.listarMisReservas().subscribe();
    const req = http.expectOne(`${api}/mis`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('obtenerPorTicket y cancelarReserva', () => {
    service.obtenerPorTicket('TK99').subscribe();
    http.expectOne(`${api}/ticket/TK99`).flush({ numeroTicket: 'TK99' });

    service.cancelarReserva('TK99').subscribe();
    const del = http.expectOne(`${api}/ticket/TK99`);
    expect(del.request.method).toBe('DELETE');
    del.flush({ message: 'ok' });
  });

  it('validarTicket con query marcarUsado y skip toast', () => {
    service.validarTicket('TK1', true).subscribe();
    const req = http.expectOne((r) => r.url.startsWith(`${api}/validar/TK1`));
    expect(req.request.method).toBe('POST');
    expect(req.request.params.get('marcarUsado')).toBe('true');
    expect(req.request.context.get(SKIP_ERROR_TOAST)).toBe(true);
    req.flush({ valido: true });
  });

  it('filtros admin', () => {
    service.listarTodas().subscribe();
    http.expectOne(`${api}/admin/todas`).flush([]);

    service.filtrarPorFuncion(3).subscribe();
    http.expectOne(`${api}/admin/funcion/3`).flush([]);

    service.filtrarPorSala(2).subscribe();
    http.expectOne(`${api}/admin/sala/2`).flush([]);

    service.filtrarPorFechas('2026-01-01', '2026-01-31').subscribe();
    const fechas = http.expectOne((r) => r.url === `${api}/admin/fechas`);
    expect(fechas.request.params.get('desde')).toBe('2026-01-01');
    expect(fechas.request.params.get('hasta')).toBe('2026-01-31');
    fechas.flush([]);
  });
});

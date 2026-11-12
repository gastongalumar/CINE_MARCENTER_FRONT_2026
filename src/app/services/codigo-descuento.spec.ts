import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { CodigoDescuentoService } from './codigo-descuento';
import { provideTestingHttp } from '../../testing/http-helpers';
import { environment } from '../../environments/environment';
import { SKIP_ERROR_TOAST } from '../utils/http.context';

describe('CodigoDescuentoService', () => {
  let service: CodigoDescuentoService;
  let http: HttpTestingController;
  const api = `${environment.apiUrl}/codigos-descuento`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTestingHttp(), CodigoDescuentoService],
    });
    service = TestBed.inject(CodigoDescuentoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('validar POST /validar con SKIP_ERROR_TOAST', () => {
    service.validar('PROMO10', 5000).subscribe();
    const req = http.expectOne(`${api}/validar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ codigo: 'PROMO10', subtotal: 5000 });
    expect(req.request.context.get(SKIP_ERROR_TOAST)).toBe(true);
    req.flush({ valido: true });
  });

  it('listar GET', () => {
    service.listar().subscribe();
    http.expectOne(api).flush([]);
  });

  it('obtener GET /:id', () => {
    service.obtener(2).subscribe();
    http.expectOne(`${api}/2`).flush({ id: 2 });
  });

  it('crear POST', () => {
    const body = { codigo: 'X', tipo: 'PORCENTAJE', valor: 10 } as never;
    service.crear(body).subscribe();
    const req = http.expectOne(api);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 1 });
  });

  it('actualizar PUT /:id', () => {
    const body = { codigo: 'X', tipo: 'PORCENTAJE', valor: 15 } as never;
    service.actualizar(2, body).subscribe();
    const req = http.expectOne(`${api}/2`);
    expect(req.request.method).toBe('PUT');
    req.flush({ id: 2 });
  });

  it('eliminar DELETE /:id', () => {
    service.eliminar(2).subscribe();
    const req = http.expectOne(`${api}/2`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'ok' });
  });
});

import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { SalaService } from './sala';
import { provideTestingHttp } from '../../testing/http-helpers';
import { environment } from '../../environments/environment';
import { SKIP_ERROR_TOAST } from '../utils/http.context';

describe('SalaService', () => {
  let service: SalaService;
  let http: HttpTestingController;
  const api = `${environment.apiUrl}/salas`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTestingHttp(), SalaService],
    });
    service = TestBed.inject(SalaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listarTodas GET', () => {
    service.listarTodas().subscribe();
    http.expectOne(api).flush([]);
  });

  it('obtenerPorId GET /:id', () => {
    service.obtenerPorId(2).subscribe();
    http.expectOne(`${api}/2`).flush({ id: 2 });
  });

  it('listarAsientos GET /:id/asientos', () => {
    service.listarAsientos(2).subscribe();
    http.expectOne(`${api}/2/asientos`).flush([]);
  });

  it('crear POST con skip toast', () => {
    const body = { nombre: 'A', filas: 10, columnas: 16 };
    service.crear(body).subscribe();
    const req = http.expectOne(api);
    expect(req.request.method).toBe('POST');
    expect(req.request.context.get(SKIP_ERROR_TOAST)).toBe(true);
    req.flush({ id: 1, ...body });
  });

  it('actualizar PUT /:id', () => {
    const body = { nombre: 'B', filas: 8, columnas: 10 };
    service.actualizar(4, body).subscribe();
    const req = http.expectOne(`${api}/4`);
    expect(req.request.method).toBe('PUT');
    req.flush({ id: 4, ...body });
  });

  it('eliminar DELETE /:id', () => {
    service.eliminar(4).subscribe();
    const req = http.expectOne(`${api}/4`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'ok' });
  });
});

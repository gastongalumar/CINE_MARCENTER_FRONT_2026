import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { CandyComboService } from './candy-combo';
import { provideTestingHttp } from '../../testing/http-helpers';
import { environment } from '../../environments/environment';

describe('CandyComboService', () => {
  let service: CandyComboService;
  let http: HttpTestingController;
  const api = `${environment.apiUrl}/candy-combos`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTestingHttp(), CandyComboService],
    });
    service = TestBed.inject(CandyComboService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listarActivos GET /activos', () => {
    service.listarActivos().subscribe();
    http.expectOne(`${api}/activos`).flush([]);
  });

  it('listarTodos GET', () => {
    service.listarTodos().subscribe();
    http.expectOne(api).flush([]);
  });

  it('obtener GET /:id', () => {
    service.obtener(5).subscribe();
    http.expectOne(`${api}/5`).flush({ id: 5 });
  });

  it('crear POST', () => {
    const body = { nombre: 'Combo', precio: 1000 } as never;
    service.crear(body).subscribe();
    const req = http.expectOne(api);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 1 });
  });

  it('actualizar PUT /:id', () => {
    const body = { nombre: 'Combo', precio: 1200 } as never;
    service.actualizar(5, body).subscribe();
    const req = http.expectOne(`${api}/5`);
    expect(req.request.method).toBe('PUT');
    req.flush({ id: 5 });
  });

  it('eliminar DELETE /:id', () => {
    service.eliminar(5).subscribe();
    const req = http.expectOne(`${api}/5`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'ok' });
  });
});

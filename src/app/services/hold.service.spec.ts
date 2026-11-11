import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { HoldService } from './hold.service';
import { provideTestingHttp } from '../../testing/http-helpers';
import { environment } from '../../environments/environment';
import { SKIP_ERROR_TOAST } from '../utils/http.context';

describe('HoldService', () => {
  let service: HoldService;
  let http: HttpTestingController;
  const api = `${environment.apiUrl}/holds`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTestingHttp(), HoldService],
    });
    service = TestBed.inject(HoldService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('crear POST con body y SKIP_ERROR_TOAST', () => {
    service.crear(5, 'A1').subscribe();
    const req = http.expectOne(api);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ funcionId: 5, etiqueta: 'A1' });
    expect(req.request.context.get(SKIP_ERROR_TOAST)).toBe(true);
    req.flush({ funcionId: 5, etiqueta: 'A1', expiraEn: 60 });
  });

  it('liberar DELETE con body', () => {
    service.liberar(5, 'B2').subscribe();
    const req = http.expectOne(api);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.body).toEqual({ funcionId: 5, etiqueta: 'B2' });
    expect(req.request.context.get(SKIP_ERROR_TOAST)).toBe(true);
    req.flush({ message: 'ok' });
  });

  it('liberarTodos DELETE por funcion', () => {
    service.liberarTodos(9).subscribe();
    const req = http.expectOne(`${api}/funcion/9`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'ok' });
  });
});

import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { FuncionService } from './funcion';
import { provideTestingHttp } from '../../testing/http-helpers';
import { environment } from '../../environments/environment';
import { SKIP_ERROR_TOAST } from '../utils/http.context';

describe('FuncionService', () => {
  let service: FuncionService;
  let http: HttpTestingController;
  const api = `${environment.apiUrl}/funciones`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTestingHttp(), FuncionService],
    });
    service = TestBed.inject(FuncionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listarTodas GET', () => {
    service.listarTodas().subscribe();
    http.expectOne(api).flush([]);
  });

  it('listarVigentes GET /vigentes', () => {
    service.listarVigentes().subscribe();
    http.expectOne(`${api}/vigentes`).flush([]);
  });

  it('listarPorPelicula GET /pelicula/:id', () => {
    service.listarPorPelicula(7).subscribe();
    http.expectOne(`${api}/pelicula/7`).flush([]);
  });

  it('obtenerPorId GET /:id', () => {
    service.obtenerPorId(3).subscribe();
    http.expectOne(`${api}/3`).flush({ id: 3 });
  });

  it('obtenerAsientosOcupados GET /:id/ocupados', () => {
    service.obtenerAsientosOcupados(3).subscribe();
    http.expectOne(`${api}/3/ocupados`).flush(['A1']);
  });

  it('obtenerEstadoAsientos con skip toast', () => {
    service.obtenerEstadoAsientos(3).subscribe();
    const req = http.expectOne(`${api}/3/estado-asientos`);
    expect(req.request.context.get(SKIP_ERROR_TOAST)).toBe(true);
    req.flush({ ocupados: [], bloqueados: [], misBloqueados: [] });
  });

  it('crear POST', () => {
    const body = { peliculaId: 1, salaId: 2 } as never;
    service.crear(body).subscribe();
    const req = http.expectOne(api);
    expect(req.request.method).toBe('POST');
    expect(req.request.context.get(SKIP_ERROR_TOAST)).toBe(true);
    req.flush({ id: 1 });
  });

  it('crearPorRango POST /por-rango', () => {
    const body = { horaInicio: '18:00' } as never;
    service.crearPorRango(body).subscribe();
    const req = http.expectOne(`${api}/por-rango`);
    expect(req.request.method).toBe('POST');
    req.flush([]);
  });

  it('eliminar DELETE /:id', () => {
    service.eliminar(9).subscribe();
    const req = http.expectOne(`${api}/9`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'ok' });
  });
});

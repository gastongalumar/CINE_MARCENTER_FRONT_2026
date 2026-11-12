import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { EstadisticasService } from './estadisticas';
import { provideTestingHttp } from '../../testing/http-helpers';
import { environment } from '../../environments/environment';
import { SKIP_ERROR_TOAST } from '../utils/http.context';

describe('EstadisticasService', () => {
  let service: EstadisticasService;
  let http: HttpTestingController;
  const api = `${environment.apiUrl}/estadisticas`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTestingHttp(), EstadisticasService],
    });
    service = TestBed.inject(EstadisticasService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('resumen GET /dashboard/resumen', () => {
    service.resumen().subscribe();
    const req = http.expectOne(`${api}/dashboard/resumen`);
    expect(req.request.context.get(SKIP_ERROR_TOAST)).toBe(true);
    req.flush({});
  });

  it('ventasPorFecha GET /reservas/por-fecha?dias=', () => {
    service.ventasPorFecha(7).subscribe();
    const req = http.expectOne((r) => r.url === `${api}/reservas/por-fecha`);
    expect(req.request.params.get('dias')).toBe('7');
    req.flush([]);
  });

  it('ventasPorPelicula GET /ocupacion/pelicula', () => {
    service.ventasPorPelicula().subscribe();
    http.expectOne(`${api}/ocupacion/pelicula`).flush([]);
  });

  it('ventasPorSala GET /ocupacion/sala', () => {
    service.ventasPorSala().subscribe();
    http.expectOne(`${api}/ocupacion/sala`).flush([]);
  });

  it('ocupacionFunciones GET con soloVigentes', () => {
    service.ocupacionFunciones(true).subscribe();
    const req = http.expectOne((r) => r.url === `${api}/ocupacion/funcion`);
    expect(req.request.params.get('soloVigentes')).toBe('true');
    req.flush([]);
  });

  it('metodosPago GET /ingresos/metodos-pago', () => {
    service.metodosPago().subscribe();
    http.expectOne(`${api}/ingresos/metodos-pago`).flush([]);
  });
});

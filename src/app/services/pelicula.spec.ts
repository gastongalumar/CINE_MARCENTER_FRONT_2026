import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { PeliculaService } from './pelicula';
import { provideTestingHttp } from '../../testing/http-helpers';
import { environment } from '../../environments/environment';
import { SKIP_ERROR_TOAST } from '../utils/http.context';

describe('PeliculaService', () => {
  let service: PeliculaService;
  let http: HttpTestingController;
  const api = `${environment.apiUrl}/peliculas`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTestingHttp(), PeliculaService],
    });
    service = TestBed.inject(PeliculaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listarTodas GET', () => {
    service.listarTodas().subscribe();
    const req = http.expectOne(api);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('listarTodas con skipErrorToast', () => {
    service.listarTodas({ skipErrorToast: true }).subscribe();
    const req = http.expectOne(api);
    expect(req.request.context.get(SKIP_ERROR_TOAST)).toBe(true);
    req.flush([]);
  });

  it('listarVigentes GET /vigentes', () => {
    service.listarVigentes().subscribe();
    http.expectOne(`${api}/vigentes`).flush([]);
  });

  it('listarProximamente GET /proximamente', () => {
    service.listarProximamente().subscribe();
    http.expectOne(`${api}/proximamente`).flush([]);
  });

  it('obtenerPorId GET /:id', () => {
    service.obtenerPorId(3).subscribe();
    const req = http.expectOne(`${api}/3`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 3 });
  });

  it('crear POST con skip toast', () => {
    const body = { nombre: 'X' } as never;
    service.crear(body).subscribe();
    const req = http.expectOne(api);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    expect(req.request.context.get(SKIP_ERROR_TOAST)).toBe(true);
    req.flush({ id: 1 });
  });

  it('actualizar PUT /:id', () => {
    service.actualizar(2, { nombre: 'Y' } as never).subscribe();
    const req = http.expectOne(`${api}/2`);
    expect(req.request.method).toBe('PUT');
    req.flush({ id: 2 });
  });

  it('eliminar DELETE /:id', () => {
    service.eliminar(9).subscribe();
    const req = http.expectOne(`${api}/9`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'ok' });
  });

  it('filtrarPorNombre', () => {
    service.filtrarPorNombre('Matrix').subscribe();
    const req = http.expectOne((r) => r.url === `${api}/filtro/nombre`);
    expect(req.request.params.get('nombre')).toBe('Matrix');
    req.flush([]);
  });

  it('filtrarPorGenero', () => {
    service.filtrarPorGenero('ACCION' as never).subscribe();
    const req = http.expectOne((r) => r.url === `${api}/filtro/genero`);
    expect(req.request.params.get('genero')).toBe('ACCION');
    req.flush([]);
  });

  it('filtrarPorFuncion', () => {
    service.filtrarPorFuncion(44).subscribe();
    http.expectOne(`${api}/filtro/funcion/44`).flush([]);
  });

  it('subirImagen POST multipart con events', () => {
    const file = new File(['x'], 'p.jpg', { type: 'image/jpeg' });
    service.subirImagen(5, file).subscribe();
    const req = http.expectOne(`${api}/5/imagen`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    expect(req.request.reportProgress).toBe(true);
    req.flush({ message: 'ok' });
  });
});

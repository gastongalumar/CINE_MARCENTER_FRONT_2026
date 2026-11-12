import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { CustomizacionService } from './customizacion';
import { provideTestingHttp } from '../../testing/http-helpers';
import { environment } from '../../environments/environment';
import { SKIP_ERROR_TOAST } from '../utils/http.context';

describe('CustomizacionService', () => {
  let service: CustomizacionService;
  let http: HttpTestingController;
  const api = `${environment.apiUrl}/customizacion`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTestingHttp(), CustomizacionService],
    });
    service = TestBed.inject(CustomizacionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('obtenerTema GET y actualiza tema$', () => {
    let recibido: unknown;
    service.tema$.subscribe((t) => (recibido = t));
    service.obtenerTema().subscribe();
    const req = http.expectOne(api);
    expect(req.request.method).toBe('GET');
    req.flush({ colorFondo: '#111111', efectoFestivo: 'navidad' });
    expect((recibido as { colorFondo: string }).colorFondo).toBe('#111111');
  });

  it('guardarTema POST con skip toast', () => {
    const body = { colorFondo: '#000000' } as never;
    service.guardarTema(body).subscribe();
    const req = http.expectOne(api);
    expect(req.request.method).toBe('POST');
    expect(req.request.context.get(SKIP_ERROR_TOAST)).toBe(true);
    req.flush(body);
  });

  it('subirLogo POST /logo multipart', () => {
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    service.subirLogo(file).subscribe();
    const req = http.expectOne(`${api}/logo`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush({ logoUrl: '/uploads/logo.png' });
  });

  it('subirFondo POST /fondo multipart', () => {
    const file = new File(['x'], 'fondo.jpg', { type: 'image/jpeg' });
    service.subirFondo(file).subscribe();
    const req = http.expectOne(`${api}/fondo`);
    expect(req.request.method).toBe('POST');
    req.flush({ fondoUrl: '/uploads/fondo.jpg' });
  });

  it('eliminarLogo DELETE /logo', () => {
    service.eliminarLogo().subscribe();
    const req = http.expectOne(`${api}/logo`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('eliminarFondo DELETE /fondo', () => {
    service.eliminarFondo().subscribe();
    const req = http.expectOne(`${api}/fondo`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  describe('normalizarEfectoFestivo', () => {
    it('acepta presets válidos', () => {
      expect(service.normalizarEfectoFestivo('navidad')).toBe('navidad');
      expect(service.normalizarEfectoFestivo('halloween')).toBe('halloween');
      expect(service.normalizarEfectoFestivo('ano-nuevo')).toBe('ano-nuevo');
      expect(service.normalizarEfectoFestivo('ninguno')).toBe('ninguno');
    });

    it('fallback a ninguno', () => {
      expect(service.normalizarEfectoFestivo(null)).toBe('ninguno');
      expect(service.normalizarEfectoFestivo('desconocido')).toBe('ninguno');
    });
  });

  it('esVideo detecta extensiones', () => {
    expect(service.esVideo('/x/fondo.mp4')).toBe(true);
    expect(service.esVideo('clip.webm?v=1')).toBe(true);
    expect(service.esVideo('foto.jpg')).toBe(false);
    expect(service.esVideo(null)).toBe(false);
  });
});

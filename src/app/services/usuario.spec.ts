import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { UsuarioService } from './usuario';
import { provideTestingHttp } from '../../testing/http-helpers';
import { environment } from '../../environments/environment';
import { SKIP_ERROR_TOAST } from '../utils/http.context';

describe('UsuarioService', () => {
  let service: UsuarioService;
  let http: HttpTestingController;
  const api = `${environment.apiUrl}/usuarios`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTestingHttp(), UsuarioService],
    });
    service = TestBed.inject(UsuarioService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar GET', () => {
    service.listar().subscribe();
    http.expectOne(api).flush([]);
  });

  it('listarPorRol GET /rol/:rol', () => {
    service.listarPorRol('ADMINISTRADOR').subscribe();
    http.expectOne(`${api}/rol/ADMINISTRADOR`).flush([]);
  });

  it('buscar GET /buscar?nombre=', () => {
    service.buscar('Ana').subscribe();
    const req = http.expectOne((r) => r.url === `${api}/buscar`);
    expect(req.request.params.get('nombre')).toBe('Ana');
    req.flush([]);
  });

  it('darDeBaja PUT /:id/baja', () => {
    service.darDeBaja(3).subscribe();
    const req = http.expectOne(`${api}/3/baja`);
    expect(req.request.method).toBe('PUT');
    req.flush({ id: 3 });
  });

  it('reactivar PUT /:id/activar', () => {
    service.reactivar(3).subscribe();
    const req = http.expectOne(`${api}/3/activar`);
    expect(req.request.method).toBe('PUT');
    req.flush({ id: 3 });
  });

  it('eliminar DELETE /:id', () => {
    service.eliminar(3).subscribe();
    const req = http.expectOne(`${api}/3`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'ok' });
  });

  it('obtenerMiPerfil GET /me', () => {
    service.obtenerMiPerfil().subscribe();
    http.expectOne(`${api}/me`).flush({ id: 1 });
  });

  it('actualizarMiPerfil PUT /mi-nombre', () => {
    const data = { nombre: 'A', apellido: 'B', telefono: null };
    service.actualizarMiPerfil(data).subscribe();
    const req = http.expectOne(`${api}/mi-nombre`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(data);
    req.flush({ id: 1, ...data });
  });

  it('subirFotoPerfil POST multipart campo foto', () => {
    const file = new File(['x'], 'f.png', { type: 'image/png' });
    service.subirFotoPerfil(file).subscribe();
    const req = http.expectOne(`${api}/me/foto`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    expect(req.request.context.get(SKIP_ERROR_TOAST)).toBe(true);
    req.flush({ id: 1 });
  });

  it('eliminarFotoPerfil DELETE /me/foto', () => {
    service.eliminarFotoPerfil().subscribe();
    const req = http.expectOne(`${api}/me/foto`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.context.get(SKIP_ERROR_TOAST)).toBe(true);
    req.flush({ id: 1 });
  });
});

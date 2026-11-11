import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { AuthService, TOKEN_STORAGE_KEY } from './auth';
import { provideTestingHttp } from '../../testing/http-helpers';
import { createExpiredJwt, createFakeJwt } from '../../testing/jwt-factory';
import { environment } from '../../environments/environment';
import type { AuthResponse } from '../models/auth';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  const api = `${environment.apiUrl}/auth`;

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideTestingHttp(), AuthService],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
    localStorage.clear();
  });

  function authResponse(overrides: Partial<AuthResponse> = {}): AuthResponse {
    const token = createFakeJwt({
      claims: { sub: 'c@test.com', tipo: 'CLIENTE', userId: 7, nombreCompleto: 'Cliente Test' },
    });
    return {
      token,
      tipo: 'CLIENTE',
      email: 'c@test.com',
      nombre: 'Cliente Test',
      id: 7,
      fotoPerfilUrl: null,
      ...overrides,
    };
  }

  it('restaura sesión válida desde sessionStorage', () => {
    const token = createFakeJwt({
      claims: { sub: 'a@b.com', tipo: 'ADMINISTRADOR', userId: 2, nombreCompleto: 'Admin' },
    });
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideTestingHttp(), AuthService],
    });
    const restored = TestBed.inject(AuthService);
    expect(restored.isAuthenticated()).toBe(true);
    expect(restored.isAdmin()).toBe(true);
    expect(restored.getCurrentUser()?.email).toBe('a@b.com');
    expect(restored.getUserId()).toBe(2);
  });

  it('limpia storage si el token restaurado está expirado', () => {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, createExpiredJwt());
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideTestingHttp(), AuthService],
    });
    const restored = TestBed.inject(AuthService);
    expect(restored.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('login guarda sesión y token', () => {
    const body = authResponse();
    let received: AuthResponse | undefined;
    service.login({ email: 'c@test.com', password: 'x' }).subscribe((r) => (received = r));
    const req = http.expectOne(`${api}/login`);
    expect(req.request.method).toBe('POST');
    req.flush(body);
    expect(received?.email).toBe('c@test.com');
    expect(sessionStorage.getItem(TOKEN_STORAGE_KEY)).toBe(body.token);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.isCliente()).toBe(true);
  });

  it('registro también inicia sesión', () => {
    const body = authResponse();
    service
      .registro({
        nombre: 'A',
        apellido: 'B',
        email: 'c@test.com',
        password: '123456',
      })
      .subscribe();
    http.expectOne(`${api}/registro`).flush(body);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('registrarAdmin NO cambia la sesión actual', () => {
    const session = authResponse({ id: 1, email: 'super@test.com', tipo: 'SUPERADMIN' });
    service.login({ email: 'super@test.com', password: 'x' }).subscribe();
    http.expectOne(`${api}/login`).flush(session);

    service
      .registrarAdmin({
        nombre: 'N',
        apellido: 'A',
        email: 'admin@test.com',
        password: '123456',
        tipo: 'ADMINISTRADOR',
      })
      .subscribe();
    http.expectOne(`${api}/registro-admin`).flush(
      authResponse({ id: 99, email: 'admin@test.com', tipo: 'ADMINISTRADOR' }),
    );
    expect(service.getCurrentUser()?.email).toBe('super@test.com');
  });

  it('forgotPassword y resetPassword llaman endpoints correctos', () => {
    service.forgotPassword('a@b.com').subscribe();
    const forgot = http.expectOne(`${api}/forgot-password`);
    expect(forgot.request.body).toEqual({ email: 'a@b.com' });
    forgot.flush({ message: 'ok' });

    service.resetPassword('tok', 'nueva123').subscribe();
    const reset = http.expectOne(`${api}/reset-password`);
    expect(reset.request.body).toEqual({ token: 'tok', passwordNueva: 'nueva123' });
    reset.flush({ message: 'ok' });
  });

  it('logout limpia signals y storage', () => {
    const body = authResponse({ fotoPerfilUrl: '/fotos/1.png' });
    service.login({ email: 'c@test.com', password: 'x' }).subscribe();
    http.expectOne(`${api}/login`).flush(body);
    expect(localStorage.getItem('foto_perfil_url')).toBe('/fotos/1.png');

    service.logout();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.getCurrentUser()).toBeNull();
    expect(sessionStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem('foto_perfil_url')).toBeNull();
  });

  it('tieneRol y updateDisplayName/updateFotoPerfil', () => {
    service.login({ email: 'c@test.com', password: 'x' }).subscribe();
    http.expectOne(`${api}/login`).flush(authResponse());
    expect(service.tieneRol('CLIENTE')).toBe(true);
    expect(service.tieneRol('ADMINISTRADOR')).toBe(false);

    service.updateDisplayName('Nuevo', 'Nombre');
    expect(service.getCurrentUser()?.nombre).toBe('Nuevo Nombre');

    service.updateFotoPerfil('/f.png');
    expect(service.getCurrentUser()?.fotoPerfilUrl).toBe('/f.png');
    expect(localStorage.getItem('foto_perfil_url')).toBe('/f.png');
  });
});

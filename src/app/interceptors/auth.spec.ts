import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpInterceptorFn } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { authInterceptor } from './auth';
import { AuthService } from '../services/auth';
import { provideTestingHttp } from '../../testing/http-helpers';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let getToken: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getToken = vi.fn(() => 'tok-123');
    TestBed.configureTestingModule({
      providers: [
        provideTestingHttp([authInterceptor as HttpInterceptorFn]),
        { provide: AuthService, useValue: { getToken } },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('no agrega Bearer en login/registro públicos', () => {
    http.post('/api/auth/login', {}).subscribe();
    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});

    http.post('/api/auth/registro', {}).subscribe();
    const reg = httpMock.expectOne('/api/auth/registro');
    expect(reg.request.headers.has('Authorization')).toBe(false);
    reg.flush({});
  });

  it('agrega Bearer en endpoints privados', () => {
    http.get('/api/reservas/mis').subscribe();
    const req = httpMock.expectOne('/api/reservas/mis');
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok-123');
    req.flush([]);
  });

  it('no agrega Authorization si no hay token', () => {
    getToken.mockReturnValue(null);
    http.get('/api/peliculas').subscribe();
    const req = httpMock.expectOne('/api/peliculas');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });
});

import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpContext, HttpInterceptorFn } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { errorInterceptor } from './error';
import { AuthService } from '../services/auth';
import { provideTestingHttp } from '../../testing/http-helpers';
import { createRouterMock, createToastrMock } from '../../testing/router-mocks';
import { SKIP_ERROR_TOAST } from '../utils/http.context';
import type { ApiError } from '../models/error';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  const router = createRouterMock();
  const toastr = createToastrMock();
  const logout = vi.fn();

  beforeEach(() => {
    logout.mockClear();
    toastr.error.mockClear();
    router.navigate.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideTestingHttp([errorInterceptor as HttpInterceptorFn]),
        { provide: Router, useValue: router },
        { provide: ToastrService, useValue: toastr },
        { provide: AuthService, useValue: { logout } },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('401 en endpoint privado → logout + cartelera sin toast', () => {
    let apiError: ApiError | undefined;
    http.get('/api/reservas/mis').subscribe({
      error: (e) => (apiError = e),
    });
    httpMock.expectOne('/api/reservas/mis').flush(
      { message: 'Unauthorized' },
      { status: 401, statusText: 'Unauthorized' },
    );
    expect(logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/cartelera']);
    expect(toastr.error).not.toHaveBeenCalled();
    expect(apiError?.message).toContain('sesión');
  });

  it('401 en login público no hace logout', () => {
    http.post('/api/auth/login', {}).subscribe({ error: () => undefined });
    httpMock.expectOne('/api/auth/login').flush(
      { message: 'bad creds' },
      { status: 401, statusText: 'Unauthorized' },
    );
    expect(logout).not.toHaveBeenCalled();
    expect(toastr.error).not.toHaveBeenCalled();
  });

  it('muestra toast en errores no-401', () => {
    http.get('/api/x').subscribe({ error: () => undefined });
    httpMock.expectOne('/api/x').flush({ message: 'boom' }, { status: 500, statusText: 'Err' });
    expect(toastr.error).toHaveBeenCalledWith('boom', 'Error');
  });

  it('SKIP_ERROR_TOAST suprime toast', () => {
    http
      .get('/api/x', { context: new HttpContext().set(SKIP_ERROR_TOAST, true) })
      .subscribe({ error: () => undefined });
    httpMock.expectOne('/api/x').flush({ message: 'silent' }, { status: 400, statusText: 'Bad' });
    expect(toastr.error).not.toHaveBeenCalled();
  });
});

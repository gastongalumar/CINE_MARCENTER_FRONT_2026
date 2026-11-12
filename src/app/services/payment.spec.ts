import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { PaymentService } from './payment';
import { provideTestingHttp } from '../../testing/http-helpers';
import { environment } from '../../environments/environment';
import { SKIP_ERROR_TOAST } from '../utils/http.context';

describe('PaymentService', () => {
  let service: PaymentService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTestingHttp(), PaymentService],
    });
    service = TestBed.inject(PaymentService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('crearPreferencia POST con reservaId y SKIP_ERROR_TOAST', () => {
    let body: unknown;
    service.crearPreferencia(42).subscribe((r) => (body = r));
    const req = http.expectOne(`${environment.apiUrl}/pagos/crear-preferencia`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reservaId: 42 });
    expect(req.request.context.get(SKIP_ERROR_TOAST)).toBe(true);
    req.flush({
      init_point: 'https://mp.example/init',
      preference_id: 'pref-1',
    });
    expect(body).toEqual(
      expect.objectContaining({ preference_id: 'pref-1', init_point: 'https://mp.example/init' }),
    );
  });
});

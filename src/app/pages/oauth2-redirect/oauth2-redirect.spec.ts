import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { OAuth2RedirectComponent } from './oauth2-redirect';
import { TOKEN_STORAGE_KEY } from '../../services/auth';
import { createExpiredJwt, createFakeJwt } from '../../../testing/jwt-factory';
import { createRouterMock } from '../../../testing/router-mocks';

describe('OAuth2RedirectComponent', () => {
  let fixture: ComponentFixture<OAuth2RedirectComponent>;
  let router: ReturnType<typeof createRouterMock>;
  let replaceSpy: ReturnType<typeof vi.fn>;
  let replaceStateSpy: ReturnType<typeof vi.fn>;
  let setItemSpy: ReturnType<typeof vi.spyOn>;
  let removeItemSpy: ReturnType<typeof vi.spyOn>;

  function setup(token: string | null, extraParams: Record<string, string> = {}) {
    router = createRouterMock();
    const params = token == null ? { ...extraParams } : { token, ...extraParams };

    TestBed.configureTestingModule({
      imports: [OAuth2RedirectComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap(params),
            },
          },
        },
        { provide: Router, useValue: router },
      ],
    });

    fixture = TestBed.createComponent(OAuth2RedirectComponent);
    return fixture.componentInstance;
  }

  beforeEach(() => {
    sessionStorage.clear();
    replaceSpy = vi.fn();
    replaceStateSpy = vi.fn();
    vi.stubGlobal('location', { ...window.location, replace: replaceSpy });
    replaceStateSpy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => undefined);
    setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('token inválido navega a login con error=google', () => {
    const component = setup('not-a-jwt');
    component.ngOnInit();

    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { error: 'google' },
    });
    expect(replaceSpy).not.toHaveBeenCalled();
    expect(removeItemSpy).toHaveBeenCalledWith(TOKEN_STORAGE_KEY);
  });

  it('token expirado navega a login con error=google', () => {
    const component = setup(createExpiredJwt({ tipo: 'CLIENTE' }));
    component.ngOnInit();

    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { error: 'google' },
    });
    expect(replaceSpy).not.toHaveBeenCalled();
  });

  it('CLIENTE válido guarda token y location.replace(/cartelera)', () => {
    const token = createFakeJwt({ claims: { tipo: 'CLIENTE' } });
    const component = setup(token);
    component.ngOnInit();

    expect(sessionStorage.getItem(TOKEN_STORAGE_KEY)).toBe(token);
    expect(setItemSpy).toHaveBeenCalledWith(TOKEN_STORAGE_KEY, token);
    expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '/oauth2/redirect');
    expect(replaceSpy).toHaveBeenCalledWith('/cartelera');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('ADMINISTRADOR válido redirige a /admin', () => {
    const token = createFakeJwt({ claims: { tipo: 'ADMINISTRADOR' } });
    const component = setup(token);
    component.ngOnInit();

    expect(replaceSpy).toHaveBeenCalledWith('/admin');
  });

  it('SUPERADMIN válido redirige a /admin', () => {
    const token = createFakeJwt({ claims: { tipo: 'SUPERADMIN' } });
    const component = setup(token);
    component.ngOnInit();

    expect(replaceSpy).toHaveBeenCalledWith('/admin');
  });

  it('nunca usa returnUrl (known gap)', () => {
    // Known gap: el redirect OAuth2 ignora returnUrl del query y siempre
    // manda a /cartelera o /admin según el rol del JWT.
    const token = createFakeJwt({ claims: { tipo: 'CLIENTE' } });
    const component = setup(token, { returnUrl: '/butacas/12/funcion/5' });
    component.ngOnInit();

    expect(replaceSpy).toHaveBeenCalledWith('/cartelera');
    expect(replaceSpy).not.toHaveBeenCalledWith('/butacas/12/funcion/5');
    expect(router.navigate).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ queryParams: expect.objectContaining({ returnUrl: expect.anything() }) })
    );
  });
});

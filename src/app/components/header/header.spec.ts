import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { HeaderComponent } from './header';
import { AuthService } from '../../services/auth';
import { CustomizacionService } from '../../services/customizacion';
import { ConfirmDialogService } from '../../services/confirm-dialog';
import { ImageService } from '../../services/image';
import { createAuthServiceMock } from '../../../testing/auth-mocks';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let auth: ReturnType<typeof createAuthServiceMock>;
  let confirmDialog: { confirm: ReturnType<typeof vi.fn> };
  let navigateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    auth = createAuthServiceMock({ authenticated: true, role: 'CLIENTE' });
    confirmDialog = { confirm: vi.fn(() => of(true)) };

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        {
          provide: CustomizacionService,
          useValue: {
            tema$: of(null),
            obtenerTema: vi.fn(() => of(null)),
          },
        },
        { provide: ConfirmDialogService, useValue: confirmDialog },
        { provide: ImageService, useValue: { getImageUrl: vi.fn(() => '') } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('logout confirma y llama AuthService.logout + navega a cartelera', () => {
    component.logout();
    expect(confirmDialog.confirm).toHaveBeenCalled();
    expect(auth.logout).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith(['/cartelera']);
  });

  it('logout cancelado no llama AuthService.logout', () => {
    confirmDialog.confirm.mockReturnValue(of(false));
    component.logout();
    expect(auth.logout).not.toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('nav cliente: Mis Reservas visible; Administración no', () => {
    fixture.detectChanges();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.textContent).toContain('Mis Reservas');
    expect(html.textContent).not.toContain('Administración');
  });

  it('nav admin: Administración visible', () => {
    auth._setAuthenticated(true);
    auth._setAdmin(true);
    fixture.detectChanges();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.textContent).toContain('Administración');
  });
});

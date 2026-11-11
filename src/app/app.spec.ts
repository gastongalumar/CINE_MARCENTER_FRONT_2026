import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AppComponent } from './app';
import { LoadingService } from './services/loading';
import { AuthService } from './services/auth';
import { CustomizacionService } from './services/customizacion';
import { ConfirmDialogService } from './services/confirm-dialog';
import { ImageService } from './services/image';
import { createAuthServiceMock } from '../testing/auth-mocks';
import { of } from 'rxjs';

describe('AppComponent', () => {
  let loadingSubject: BehaviorSubject<boolean>;
  let forceHide: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    loadingSubject = new BehaviorSubject<boolean>(false);
    forceHide = vi.fn();

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        {
          provide: LoadingService,
          useValue: { isLoading$: loadingSubject.asObservable(), forceHide },
        },
        { provide: AuthService, useValue: createAuthServiceMock() },
        {
          provide: CustomizacionService,
          useValue: { tema$: of(null), obtenerTema: vi.fn(() => of(null)) },
        },
        { provide: ConfirmDialogService, useValue: { confirm: vi.fn(() => of(false)) } },
        { provide: ImageService, useValue: { getImageUrl: vi.fn(() => '') } },
      ],
    }).compileComponents();
  });

  it('should create the app with title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.componentInstance.title).toBe('Gestor de Cine');
  });

  it('sincroniza showSplash con LoadingService.isLoading$', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.ngOnInit();
    expect(app.showSplash).toBe(false);
    loadingSubject.next(true);
    expect(app.showSplash).toBe(true);
    loadingSubject.next(false);
    expect(app.showSplash).toBe(false);
  });

  it('NavigationEnd fuerza forceHide del LoadingService', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.componentInstance.ngOnInit();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/');
    expect(forceHide).toHaveBeenCalled();
  });
});

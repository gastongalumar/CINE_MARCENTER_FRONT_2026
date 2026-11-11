import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer';

describe('FooterComponent', () => {
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('crea y muestra branding / soporte', () => {
    expect(fixture.componentInstance).toBeTruthy();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('footer')).toBeTruthy();
    expect(el.textContent).toContain('CineMarcenter');
    expect(el.textContent).toContain('soporte@cineapp.local');
  });
});

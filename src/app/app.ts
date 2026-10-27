import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// import { OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Router, NavigationEnd } from '@angular/router';
// import { HeaderComponent } from './components/header/header';
// import { FooterComponent } from './components/footer/footer';
// import { SplashComponent } from './pages/splash/splash.component';
// import { LoadingService } from './services/loading.service';
// import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  // imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent, SplashComponent],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./app.css'],
})
export class AppComponent {
  title = 'Gestor de Cine';
  showSplash = false;

  // constructor(
  //   private loadingService: LoadingService,
  //   private router: Router
  // ) {}
  //
  // ngOnInit() {
  //   this.loadingService.isLoading$.subscribe((loading) => {
  //     this.showSplash = loading;
  //   });
  //
  //   this.router.events.pipe(
  //     filter((event): event is NavigationEnd => event instanceof NavigationEnd)
  //   ).subscribe(() => {
  //     this.loadingService.forceHide();
  //   });
  // }
}

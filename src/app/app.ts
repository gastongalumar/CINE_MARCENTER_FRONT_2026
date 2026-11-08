import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './components/header/header';
import { FooterComponent } from './components/footer/footer';
import { SplashComponent } from './pages/splash/splash';
import { LoadingService } from './services/loading';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent, SplashComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class AppComponent implements OnInit {
  title = 'Gestor de Cine';
  showSplash = false;

  constructor(
    private loadingService: LoadingService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadingService.isLoading$.subscribe((loading) => {
      this.showSplash = loading;
    });

    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.loadingService.forceHide();
    });
  }
}

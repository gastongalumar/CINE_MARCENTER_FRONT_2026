import { ApplicationConfig, importProvidersFrom, provideZonelessChangeDetection, LOCALE_ID } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';

import { provideAnimations } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth';
import { errorInterceptor } from './interceptors/error';

registerLocaleData(localeEsAr);

const providersList: ApplicationConfig['providers'] = [
  { provide: LOCALE_ID, useValue: 'es-AR' },
  provideZonelessChangeDetection(),
  provideRouter(routes, withComponentInputBinding()),
  provideHttpClient(
    withInterceptors([authInterceptor, errorInterceptor])
  ),

  provideAnimations(),
  provideCharts(withDefaultRegisterables()),
  importProvidersFrom(
    ToastrModule.forRoot({
      positionClass: 'toast-top-right',
      timeOut: 3500,
      preventDuplicates: true,
      closeButton: true,
      progressBar: true,
      newestOnTop: true,
      tapToDismiss: true,
    })
  ),
];

export const appConfig: ApplicationConfig = {
  providers: providersList
};

import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { AppComponent } from './app/app';
import { config } from './app/app.config.server';

// Exportar una función por defecto con la firma esperada por el runtime
// (context: BootstrapContext) => Promise<ApplicationRef>
export default (context: BootstrapContext) => {
  // Añadir el contexto como provider a la configuración de la aplicación
  const appConfigWithContext: ApplicationConfig = mergeApplicationConfig(config, {
    providers: [
      // Exponer el contexto al runtime de la aplicación si algún servicio lo necesita
      { provide: 'SERVER_CONTEXT', useValue: context }
    ]
  });

  // Pasar el `context` como tercer argumento para cumplir la firma esperada por el runtime SSR
  return bootstrapApplication(AppComponent, appConfigWithContext, context);
};


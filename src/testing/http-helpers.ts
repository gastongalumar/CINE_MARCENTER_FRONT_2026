import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import type { EnvironmentProviders, Provider } from '@angular/core';
import type { HttpInterceptorFn } from '@angular/common/http';

/** Providers estándar para tests HTTP con HttpTestingController. */
export function provideTestingHttp(
  interceptors: HttpInterceptorFn[] = [],
): Array<Provider | EnvironmentProviders> {
  if (interceptors.length) {
    return [provideHttpClient(withInterceptors(interceptors)), provideHttpClientTesting()];
  }
  return [provideHttpClient(), provideHttpClientTesting()];
}

export type { HttpTestingController };

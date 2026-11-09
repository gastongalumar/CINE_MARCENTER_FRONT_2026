import { HttpContext, HttpContextToken } from '@angular/common/http';

/** Si es true, el error interceptor no muestra toast (el componente maneja el error). */
export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);

/** Contexto HTTP para que el interceptor no muestre toast de error. */
export function skipErrorToastContext(): HttpContext {
  return new HttpContext().set(SKIP_ERROR_TOAST, true);
}

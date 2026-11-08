import { HttpContextToken } from '@angular/common/http';

/** Si es true, el error interceptor no muestra toast (el componente maneja el error). */
export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);

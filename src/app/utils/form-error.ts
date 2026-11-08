import { FormGroup } from '@angular/forms';
import { getFieldErrorsFromError } from './api-error';

/**
 * Utilidades para formularios reactivos y los errores de validación que
 * devuelve el backend.
 *
 * El backend responde con un cuerpo `ErrorResponse` que incluye
 * `fieldErrors: [{ field, message }]`. Esta función los proyecta sobre los
 * controles del formulario para que el usuario vea el error debajo del
 * campo correspondiente.
 */

/**
 * Marca los controles indicados con el error devuelto por el backend.
 *
 * @param form formulario reactivo
 * @param error error de la API (ya normalizado por el interceptor)
 * @param mapping mapa opcional `campoBackend` → `nombreControl` cuando los
 *                nombres no coinciden (por ejemplo `duracionMinutos`).
 * @returns `true` si se aplicó al menos un error de campo.
 */
export function aplicarErroresDeCampos(
  form: FormGroup,
  error: unknown,
  mapping: Record<string, string> = {}
): boolean {
  const errores = getFieldErrorsFromError(error);
  if (!errores || Object.keys(errores).length === 0) {
    return false;
  }

  let aplicados = false;

  for (const [campo, mensaje] of Object.entries(errores)) {
    const nombreControl = mapping[campo] ?? campo;
    const control = form.get(nombreControl);
    if (!control) continue;

    control.setErrors({ ...(control.errors ?? {}), backend: mensaje });
    control.markAsTouched();
    control.markAsDirty();
    control.updateValueAndValidity();
    aplicados = true;
  }

  return aplicados;
}

/**
 * Limpia los errores de validación provenientes del backend de un control.
 *
 * @param form formulario reactivo
 * @param nombres nombres de los controles a limpiar (opcional: todos).
 */
export function limpiarErroresDeCampos(form: FormGroup, nombres?: string[]): void {
  const controles = nombres?.length
    ? nombres.map((n) => form.get(n)).filter((c): c is NonNullable<typeof c> => !!c)
    : Object.values(form.controls);

  for (const control of controles) {
    if (control.errors && 'backend' in control.errors) {
      const { backend, ...resto } = control.errors;
      control.setErrors(Object.keys(resto).length ? resto : null);
    }
  }
}

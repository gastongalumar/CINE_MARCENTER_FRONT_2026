import { HttpErrorResponse } from '@angular/common/http';
import { ApiError, ErrorResponse, FieldError } from '../models/error';

export function parseErrorResponse(error: HttpErrorResponse): ErrorResponse {
  if (typeof ErrorEvent !== 'undefined' && error.error instanceof ErrorEvent) {
    return { message: error.error.message, status: error.status };
  }

  if (typeof error.error === 'string') {
    return { message: error.error, status: error.status };
  }

  if (error.error && typeof error.error === 'object') {
    return { ...(error.error as ErrorResponse), status: error.status };
  }

  if (error.status === 0) {
    return {
      message: 'No se pudo conectar con el servidor. Verifique que el backend esté en ejecución.',
      status: 0
    };
  }

  switch (error.status) {
    case 400:
      return { message: 'Solicitud incorrecta.', status: 400 };
    case 403:
      return {
        message: 'No tienes permisos para esta acción. Verifica que hayas iniciado sesión con una cuenta administradora.',
        status: 403
      };
    case 404:
      return { message: 'Recurso no encontrado.', status: 404 };
    case 500:
      return { message: 'Error interno del servidor.', status: 500 };
    default:
      return { message: `Error ${error.status}: ${error.statusText}`, status: error.status };
  }
}

export function getDisplayMessage(err: ErrorResponse): string {
  if (err.fieldErrors?.length) {
    const detalle = err.fieldErrors.map(f => `${f.field}: ${f.message}`).join('; ');
    return err.message ? `${err.message} (${detalle})` : detalle;
  }
  if (err.message) return err.message;
  if (err.error) return err.error;
  return 'Ocurrió un error inesperado';
}

export function getFieldErrorsMap(err: ErrorResponse): Record<string, string> {
  const map: Record<string, string> = {};
  err.fieldErrors?.forEach((fe: FieldError) => {
    map[fe.field] = fe.message;
  });
  return map;
}

export function toApiError(error: HttpErrorResponse, messageOverride?: string): ApiError {
  const parsed = parseErrorResponse(error);
  const message = messageOverride ?? getDisplayMessage(parsed);
  return {
    message,
    fieldErrors: parsed.fieldErrors,
    fieldErrorsMap: getFieldErrorsMap(parsed),
    status: error.status,
    original: error
  };
}

export function getErrorMessage(err: unknown, fallback = 'Ocurrió un error inesperado'): string {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as ApiError).message === 'string') {
    return (err as ApiError).message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}

export function getFieldErrorsFromError(err: unknown): Record<string, string> {
  if (err && typeof err === 'object' && 'fieldErrorsMap' in err) {
    return (err as ApiError).fieldErrorsMap ?? {};
  }
  return {};
}

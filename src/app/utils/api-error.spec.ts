import { HttpErrorResponse } from '@angular/common/http';
import {
  getDisplayMessage,
  getErrorMessage,
  getFieldErrorsFromError,
  getFieldErrorsMap,
  parseErrorResponse,
  toApiError,
} from './api-error';

function httpError(status: number, error: unknown, statusText = 'Error'): HttpErrorResponse {
  return new HttpErrorResponse({ status, statusText, error, url: '/api/x' });
}

describe('api-error utils', () => {
  describe('parseErrorResponse', () => {
    it('parsea string body', () => {
      expect(parseErrorResponse(httpError(400, 'boom'))).toEqual({
        message: 'boom',
        status: 400,
      });
    });

    it('parsea objeto ErrorResponse', () => {
      const parsed = parseErrorResponse(
        httpError(422, {
          message: 'validación',
          fieldErrors: [{ field: 'email', message: 'inválido' }],
        }),
      );
      expect(parsed.message).toBe('validación');
      expect(parsed.fieldErrors?.[0].field).toBe('email');
      expect(parsed.status).toBe(422);
    });

    it('status 0 ⇒ mensaje de conexión', () => {
      expect(parseErrorResponse(httpError(0, null)).message).toContain('conectar');
    });

    it('usa mensajes por status cuando no hay body', () => {
      expect(parseErrorResponse(httpError(403, null)).message).toContain('permisos');
      expect(parseErrorResponse(httpError(404, null)).message).toContain('no encontrado');
      expect(parseErrorResponse(httpError(500, null)).message).toContain('interno');
      expect(parseErrorResponse(httpError(418, null, "I'm a teapot")).message).toContain('418');
    });
  });

  describe('getDisplayMessage / field maps', () => {
    it('prioriza fieldErrors unidos', () => {
      expect(
        getDisplayMessage({
          fieldErrors: [
            { field: 'a', message: 'A' },
            { field: 'b', message: 'B' },
          ],
        }),
      ).toBe('A; B');
    });

    it('cae a message / error / default', () => {
      expect(getDisplayMessage({ message: 'm' })).toBe('m');
      expect(getDisplayMessage({ error: 'e' })).toBe('e');
      expect(getDisplayMessage({})).toBe('Ocurrió un error inesperado');
    });

    it('getFieldErrorsMap indexa por field', () => {
      expect(
        getFieldErrorsMap({
          fieldErrors: [{ field: 'precio', message: 'min 1' }],
        }),
      ).toEqual({ precio: 'min 1' });
    });
  });

  describe('toApiError / getters', () => {
    it('arma ApiError con override de mensaje', () => {
      const api = toApiError(httpError(400, { message: 'x' }), 'override');
      expect(api.message).toBe('override');
      expect(api.status).toBe(400);
      expect(api.original).toBeInstanceOf(HttpErrorResponse);
    });

    it('getErrorMessage y getFieldErrorsFromError', () => {
      expect(getErrorMessage({ message: 'hola' })).toBe('hola');
      expect(getErrorMessage(new Error('e'))).toBe('e');
      expect(getErrorMessage(null, 'fb')).toBe('fb');
      expect(getFieldErrorsFromError({ fieldErrorsMap: { a: '1' } })).toEqual({ a: '1' });
      expect(getFieldErrorsFromError(null)).toEqual({});
    });
  });
});

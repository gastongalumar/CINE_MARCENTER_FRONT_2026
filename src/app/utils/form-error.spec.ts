import { FormControl, FormGroup } from '@angular/forms';
import {
  aplicarErroresDeCampos,
  esControlInvalido,
  limpiarErroresDeCampos,
} from './form-error';

describe('form-error utils', () => {
  describe('esControlInvalido', () => {
    it('false si null/undefined', () => {
      expect(esControlInvalido(null)).toBe(false);
      expect(esControlInvalido(undefined)).toBe(false);
    });

    it('false si inválido pero pristine/untouched', () => {
      const c = new FormControl('', { validators: () => ({ required: true }) });
      expect(c.invalid).toBe(true);
      expect(esControlInvalido(c)).toBe(false);
    });

    it('true si inválido y touched', () => {
      const c = new FormControl('', { validators: () => ({ required: true }) });
      c.markAsTouched();
      expect(esControlInvalido(c)).toBe(true);
    });

    it('true si inválido y dirty', () => {
      const c = new FormControl('', { validators: () => ({ required: true }) });
      c.markAsDirty();
      expect(esControlInvalido(c)).toBe(true);
    });
  });

  describe('aplicarErroresDeCampos', () => {
    it('false sin fieldErrorsMap', () => {
      const form = new FormGroup({ email: new FormControl('') });
      expect(aplicarErroresDeCampos(form, { message: 'x' })).toBe(false);
    });

    it('aplica backend error y marca touched/dirty', () => {
      const form = new FormGroup({ email: new FormControl('') });
      const error = {
        message: 'validación',
        fieldErrorsMap: { email: 'ya existe' },
      };
      expect(aplicarErroresDeCampos(form, error)).toBe(true);
      expect(form.get('email')?.errors?.['backend']).toBe('ya existe');
      expect(form.get('email')?.touched).toBe(true);
      expect(form.get('email')?.dirty).toBe(true);
    });

    it('respeta mapping de nombres', () => {
      const form = new FormGroup({ duracion: new FormControl('') });
      const error = {
        message: 'validación',
        fieldErrorsMap: { duracionMinutos: 'corto' },
      };
      expect(aplicarErroresDeCampos(form, error, { duracionMinutos: 'duracion' })).toBe(true);
      expect(form.get('duracion')?.errors?.['backend']).toBe('corto');
    });

    it('ignora campos inexistentes en el form', () => {
      const form = new FormGroup({ email: new FormControl('') });
      const error = {
        message: 'validación',
        fieldErrorsMap: { otro: 'x' },
      };
      expect(aplicarErroresDeCampos(form, error)).toBe(false);
    });
  });

  describe('limpiarErroresDeCampos', () => {
    it('quita solo backend y conserva otros errores', () => {
      const form = new FormGroup({
        email: new FormControl(''),
        nombre: new FormControl(''),
      });
      form.get('email')?.setErrors({ required: true, backend: 'dup' });
      form.get('nombre')?.setErrors({ backend: 'bad' });

      limpiarErroresDeCampos(form, ['email']);
      expect(form.get('email')?.errors).toEqual({ required: true });
      expect(form.get('nombre')?.errors?.['backend']).toBe('bad');

      limpiarErroresDeCampos(form);
      expect(form.get('nombre')?.errors).toBeNull();
    });
  });
});

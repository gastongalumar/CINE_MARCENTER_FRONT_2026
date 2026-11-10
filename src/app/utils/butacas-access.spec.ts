import {
  autorizarButacas,
  autorizarFuncion,
  funcionIdDesdeButacasUrl,
  limpiarFuncionAutorizada,
  peliculaIdDesdeButacasUrl,
  puedeAccederButacas,
  puedeAccederFuncion,
} from './butacas-access';

describe('butacas-access', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  describe('película', () => {
    it('autorizarButacas permite acceder al mismo id', () => {
      autorizarButacas(12);
      expect(puedeAccederButacas(12)).toBe(true);
      expect(puedeAccederButacas(99)).toBe(false);
    });

    it('rechaza ids inválidos', () => {
      expect(puedeAccederButacas(0)).toBe(false);
      expect(puedeAccederButacas(-1)).toBe(false);
      autorizarButacas(0);
      expect(sessionStorage.getItem('cine.butacas.peliculaId')).toBeNull();
    });
  });

  describe('función', () => {
    it('autorizarFuncion permite acceder al mismo id', () => {
      autorizarFuncion(5);
      expect(puedeAccederFuncion(5)).toBe(true);
      expect(puedeAccederFuncion(7)).toBe(false);
    });

    it('limpiarFuncionAutorizada quita el ticket', () => {
      autorizarFuncion(5);
      limpiarFuncionAutorizada();
      expect(puedeAccederFuncion(5)).toBe(false);
    });
  });

  describe('parseo de URLs', () => {
    it('peliculaIdDesdeButacasUrl', () => {
      expect(peliculaIdDesdeButacasUrl('/butacas/12')).toBe(12);
      expect(peliculaIdDesdeButacasUrl('/butacas/12/funcion/3')).toBe(12);
      expect(peliculaIdDesdeButacasUrl('/butacas/12/funcion/3/pago')).toBe(12);
      expect(peliculaIdDesdeButacasUrl('/cartelera')).toBeNull();
    });

    it('funcionIdDesdeButacasUrl', () => {
      expect(funcionIdDesdeButacasUrl('/butacas/12/funcion/5')).toBe(5);
      expect(funcionIdDesdeButacasUrl('/butacas/12/funcion/5/pago')).toBe(5);
      expect(funcionIdDesdeButacasUrl('/butacas/12')).toBeNull();
      expect(funcionIdDesdeButacasUrl('/cartelera')).toBeNull();
    });
  });
});

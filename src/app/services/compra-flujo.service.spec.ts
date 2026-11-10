import { CompraFlujoService } from './compra-flujo.service';

describe('CompraFlujoService', () => {
  let service: CompraFlujoService;

  beforeEach(() => {
    service = new CompraFlujoService();
  });

  it('setSeleccion normaliza y ordena etiquetas', () => {
    service.setSeleccion(['b2', ' a1 ']);
    expect(service.asientosSeleccionados).toEqual(['A1', 'B2']);
  });

  it('tieneSeleccionPara exige mismo funcionId y asientos', () => {
    service.setContexto(1, 10);
    expect(service.tieneSeleccionPara(10)).toBe(false);
    service.setSeleccion(['A1']);
    expect(service.tieneSeleccionPara(10)).toBe(true);
    expect(service.tieneSeleccionPara(99)).toBe(false);
  });

  it('marcarNavegacionAPago / consumirPreservarHolds es one-shot', () => {
    expect(service.consumirPreservarHolds()).toBe(false);
    service.marcarNavegacionAPago();
    expect(service.consumirPreservarHolds()).toBe(true);
    expect(service.consumirPreservarHolds()).toBe(false);
  });

  it('clear limpia selección, funcionId y flag de holds', () => {
    service.setContexto(1, 10);
    service.setSeleccion(['A1']);
    service.marcarNavegacionAPago();
    service.clear();
    expect(service.funcionId).toBeNull();
    expect(service.asientosSeleccionados).toEqual([]);
    expect(service.consumirPreservarHolds()).toBe(false);
  });
});

import { CompraFlujoService, MAX_ENTRADAS_COMPRA } from './compra-flujo.service';

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

  it('clear NO limpia peliculaId (estado parcial documentado)', () => {
    service.setContexto(77, 10);
    service.clear();
    expect(service.peliculaId).toBe(77);
  });

  it('setContexto y clearSeleccion', () => {
    service.setContexto(3, 8);
    expect(service.peliculaId).toBe(3);
    expect(service.funcionId).toBe(8);
    service.setSeleccion(['C1', 'C2']);
    service.clearSeleccion();
    expect(service.asientosSeleccionados).toEqual([]);
    expect(service.funcionId).toBe(8);
  });

  it('documenta MAX_ENTRADAS_COMPRA = 20 (límite aplicado en UI, no en el service)', () => {
    expect(MAX_ENTRADAS_COMPRA).toBe(20);
    // El service acepta más de 20; el tope vive en compra-asientos.
    service.setSeleccion(Array.from({ length: 25 }, (_, i) => `A${i + 1}`));
    expect(service.asientosSeleccionados.length).toBe(25);
  });
});

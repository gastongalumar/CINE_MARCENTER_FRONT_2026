import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SeatMapComponent } from './seat-map';

describe('SeatMapComponent', () => {
  let fixture: ComponentFixture<SeatMapComponent>;
  let component: SeatMapComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeatMapComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SeatMapComponent);
    component = fixture.componentInstance;
  });

  function findAsiento(etiqueta: string) {
    for (const fila of component.filasMapa()) {
      const found = [...fila.izquierda, ...fila.derecha].find((a) => a.etiqueta === etiqueta);
      if (found) return found;
    }
    return undefined;
  }

  it('arma filas y columnas partidas por pasillo', () => {
    component.filas = 2;
    component.columnas = 4;

    expect(component.columnasIzquierda()).toEqual([1, 2]);
    expect(component.columnasDerecha()).toEqual([3, 4]);

    const filas = component.filasMapa();
    expect(filas).toHaveLength(2);
    expect(filas[0].letra).toBe('A');
    expect(filas[1].letra).toBe('B');
    expect(filas[0].izquierda.map((a) => a.etiqueta)).toEqual(['A1', 'A2']);
    expect(filas[0].derecha.map((a) => a.etiqueta)).toEqual(['A3', 'A4']);
  });

  it('marca ocupados, bloqueados y seleccionados', () => {
    component.filas = 1;
    component.columnas = 4;
    component.ocupados = ['a1'];
    component.bloqueados = ['A2'];
    component.seleccionados = ['A3'];

    expect(findAsiento('A1')?.estado).toBe('ocupada');
    expect(findAsiento('A2')?.estado).toBe('bloqueada');
    expect(findAsiento('A3')?.estado).toBe('seleccionada');
    expect(findAsiento('A4')?.estado).toBe('libre');
  });

  it('en soloLectura no emite selección', () => {
    component.filas = 1;
    component.columnas = 2;
    component.soloLectura = true;

    const seleccionSpy = vi.fn();
    const limiteSpy = vi.fn();
    component.seleccionChange.subscribe(seleccionSpy);
    component.limiteAlcanzado.subscribe(limiteSpy);

    component.alternar('A1');

    expect(seleccionSpy).not.toHaveBeenCalled();
    expect(limiteSpy).not.toHaveBeenCalled();
    expect(findAsiento('A1')?.estado).toBe('libre');
  });

  it('toggle select y deselect emite etiquetas ordenadas', () => {
    component.filas = 1;
    component.columnas = 3;
    const spy = vi.fn();
    component.seleccionChange.subscribe(spy);

    component.alternar('A2');
    expect(spy).toHaveBeenLastCalledWith(['A2']);
    expect(findAsiento('A2')?.estado).toBe('seleccionada');

    component.alternar('A1');
    expect(spy).toHaveBeenLastCalledWith(['A1', 'A2']);

    component.alternar('A2');
    expect(spy).toHaveBeenLastCalledWith(['A1']);
    expect(findAsiento('A2')?.estado).toBe('libre');
  });

  it('maxSeleccionados emite limiteAlcanzado y no agrega', () => {
    component.filas = 1;
    component.columnas = 3;
    component.maxSeleccionados = 1;
    component.seleccionados = ['A1'];

    const seleccionSpy = vi.fn();
    const limiteSpy = vi.fn();
    component.seleccionChange.subscribe(seleccionSpy);
    component.limiteAlcanzado.subscribe(limiteSpy);

    component.alternar('A2');

    expect(limiteSpy).toHaveBeenCalledTimes(1);
    expect(seleccionSpy).not.toHaveBeenCalled();
    expect(findAsiento('A2')?.estado).toBe('libre');
    expect(findAsiento('A1')?.estado).toBe('seleccionada');
  });

  it('ignora clicks en ocupados y bloqueados', () => {
    component.filas = 1;
    component.columnas = 2;
    component.ocupados = ['A1'];
    component.bloqueados = ['A2'];

    const spy = vi.fn();
    component.seleccionChange.subscribe(spy);

    component.alternar('A1');
    component.alternar('A2');

    expect(spy).not.toHaveBeenCalled();
    expect(findAsiento('A1')?.estado).toBe('ocupada');
    expect(findAsiento('A2')?.estado).toBe('bloqueada');
  });
});

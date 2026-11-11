import { InicialesPipe } from './iniciales';

describe('InicialesPipe', () => {
  const pipe = new InicialesPipe();

  it('vacío → string vacío', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform('   ')).toBe('');
  });

  it('una palabra → primera letra mayúscula', () => {
    expect(pipe.transform('Cinemacenter')).toBe('C');
  });

  it('dos o más palabras → primeras dos iniciales', () => {
    expect(pipe.transform('Juan Pérez')).toBe('JP');
    expect(pipe.transform('  ana  maría  lopez ')).toBe('AM');
  });
});

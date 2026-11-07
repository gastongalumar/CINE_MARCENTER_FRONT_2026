export interface Customizacion {
  colorFondo: string;
  colorContenedor: string;
  colorFuente: string;
  colorSlider: string;
  tamanoFuenteTitulos: string; // Podría ser string con unidad (ej. '20px')
  tamanoFuenteTexto: string;    // Podría ser string con unidad (ej. '14px')
  logoUrl?: string;
  fondoUrl?: string;
  logoTamano?: string; // Podría ser string con unidad (ej. '120px')
  logoOpacity?: string; // Valor entre '0' y '1'
  globalOpacity?: string; // Valor entre '0' y '1'

  nombreCine?: string;
}

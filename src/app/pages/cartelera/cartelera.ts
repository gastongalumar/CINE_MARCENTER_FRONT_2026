import { Component, OnDestroy, ChangeDetectorRef, Inject, PLATFORM_ID, afterNextRender, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PeliculaService } from '../../services/pelicula';
import { ImageService } from '../../services/image';
import { AuthService } from '../../services/auth';
import { Pelicula } from '../../models/pelicula';
import { GENEROS_PELICULA, etiquetaGenero } from '../../models/genero-pelicula';
import { refreshView } from '../../utils/refresh-view';
import { autorizarButacas } from '../../utils/butacas-access';

@Component({
  selector: 'app-cartelera',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './cartelera.html',
  styleUrls: ['./cartelera.css'],
})
export class CarteleraComponent implements OnDestroy {

  private readonly initLoad = afterNextRender(() => {
    this.cargarPeliculas();
    this.iniciarPromoAutoplay();
  });
  readonly diasProximamente = 30;
  readonly heroMaxSlides = 6;
  private readonly heroAutoplayMs = 3000;
  private heroAutoplayId: ReturnType<typeof setInterval> | null = null;
  private readonly promoAutoplayMs = 4000;
  private promoAutoplayId: ReturnType<typeof setInterval> | null = null;

  peliculas: Pelicula[] = [];
  peliculasProximamente: Pelicula[] = [];
  peliculasFiltradas: Pelicula[] = [];
  /** Carrusel de próximos estrenos. */
  proximosHero: Pelicula[] = [];
  heroIndex = 0;
  seccionActiva: 'cartelera' | 'proximos' | 'candy' = 'proximos';
  private peliculasVigentesBase: Pelicula[] = [];
  private peliculasProximamenteBase: Pelicula[] = [];
  private todasPeliculasBase: Pelicula[] = [];
  loading = true;
  loadingMore = false;
  pageSize = 8;
  currentPage = 0;
  totalPages = 0;
  imageErrorMap: { [key: number]: boolean } = {};
  filtroNombre = '';
  filtroGenero = '';
  generoAbierto = false;
  generos = GENEROS_PELICULA;
  etiquetaGenero = etiquetaGenero;

  /** Banners estáticos de candy / publicidad (TP – material simulado). */
  readonly candySlides = [
    {
      src: 'assets/images/promos/candy-pochoclos.jpg',
      titulo: 'Balde de pochoclos',
      subtitulo: 'Candy Bar · Cine Marcenter'
    },
    {
      src: 'assets/images/promos/promo-combo.jpg',
      titulo: 'Combo Marcenter',
      subtitulo: 'Pochoclos + gaseosa + golosinas'
    }
  ];
  candyIndex = 0;

  /** Carrusel chico de beneficios / promociones (sidebar). */
  readonly promoSlides = [
    {
      id: 'happy-hour',
      titulo: 'Cinema Happy Hour',
      barra: '2x1 · Jueves a martes antes de las 18 hs',
      src: 'assets/images/promos/promo-happy-hour.jpg',
    },
    {
      id: 'miercoles',
      titulo: 'Miércoles de rebajas',
      barra: '25% off en entradas · solo miércoles',
      src: 'assets/images/promos/promo-miercoles.jpg',
    },
    {
      id: 'planazo',
      titulo: 'Planazo de amigos',
      barra: '4x2 en entradas · jueves y viernes',
      src: 'assets/images/promos/promo-planazo.jpg',
    },
    {
      id: 'mp-qr',
      titulo: 'Mercado Pago QR',
      barra: '10% off en Candy Bar pagando con QR',
      src: 'assets/images/promos/promo-mp-qr.jpg',
    },
    {
      id: 'tarjeta',
      titulo: 'Tarjeta Marcenter',
      barra: '2x1 en entradas con tarjeta adherida',
      src: 'assets/images/promos/promo-tarjeta.jpg',
    },
  ];
  promoIndex = 0;

  readonly promoEventos = [
    {
      src: 'assets/images/promos/promo-cumple.jpg',
      titulo: 'Festejá tu cumple en el cine',
      texto: 'Paquetes especiales con sala, pochoclos y sorpresas para celebrar con amigos.',
      link: '/contacto/cumpleanos',
    },
    {
      src: 'assets/images/promos/promo-combo.jpg',
      titulo: 'Candy Bar Marcenter',
      texto: 'Combos y snacks para disfrutar la función. Precios y opciones en boletería.',
      link: '/contacto/candy',
    },
  ];

  constructor(
    private peliculaService: PeliculaService,
    public imageService: ImageService,
    public authService: AuthService,
    private router: Router,
    private cd: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  @HostListener('document:click')
  cerrarGeneroDropdown(): void {
    this.generoAbierto = false;
  }

  toggleGeneroDropdown(event: Event): void {
    event.stopPropagation();
    this.generoAbierto = !this.generoAbierto;
    refreshView(this.cd);
  }

  seleccionarGenero(genero: string): void {
    this.filtroGenero = genero;
    this.generoAbierto = false;
    this.aplicarFiltrosLocales();
  }

  ngOnDestroy(): void {
    this.loading = false;
    this.detenerHeroAutoplay();
    this.detenerPromoAutoplay();
  }

  get heroActual(): Pelicula | null {
    return this.proximosHero[this.heroIndex] ?? null;
  }

  cargarPeliculas(): void {
    this.loading = true;
    this.currentPage = 0;
    this.filtroNombre = '';
    this.filtroGenero = '';
    this.detenerHeroAutoplay();
    forkJoin({
      vigentes: this.peliculaService.listarVigentes(),
      todas: this.peliculaService.listarTodas()
    }).subscribe({
      next: ({ vigentes, todas }) => {
        this.todasPeliculasBase = todas || [];
        this.peliculasVigentesBase = vigentes || [];
        this.peliculasProximamenteBase = this.obtenerProximamente(this.todasPeliculasBase, this.peliculasVigentesBase);
        this.currentPage = 0;
        this.totalPages = Math.max(1, Math.ceil(this.peliculasVigentesBase.length / this.pageSize));
        this.peliculas = this.peliculasVigentesBase.slice(0, this.pageSize);
        this.peliculasProximamente = [...this.peliculasProximamenteBase];
        this.peliculasFiltradas = [];
        this.armarProximosHero();
        this.loading = false;
        refreshView(this.cd);
      },
      error: (error) => {
        console.error('Error al cargar películas:', error);
        this.loading = false;
        refreshView(this.cd);
      }
    });
  }

  /** Carrusel con próximos estrenos (ordenados por fecha cercana). */
  private armarProximosHero(): void {
    this.proximosHero = [...this.peliculasProximamenteBase].slice(0, this.heroMaxSlides);
    this.heroIndex = 0;
    this.iniciarHeroAutoplay();
  }

  iniciarHeroAutoplay(): void {
    this.detenerHeroAutoplay();
    if (!isPlatformBrowser(this.platformId) || this.proximosHero.length < 2) return;
    this.heroAutoplayId = setInterval(() => this.heroSiguiente(false), this.heroAutoplayMs);
  }

  detenerHeroAutoplay(): void {
    if (this.heroAutoplayId != null) {
      clearInterval(this.heroAutoplayId);
      this.heroAutoplayId = null;
    }
  }

  heroAnterior(): void {
    const total = this.proximosHero.length;
    if (!total) return;
    this.heroIndex = (this.heroIndex - 1 + total) % total;
    this.iniciarHeroAutoplay();
    refreshView(this.cd);
  }

  heroSiguiente(reiniciarAutoplay = true): void {
    const total = this.proximosHero.length;
    if (!total) return;
    this.heroIndex = (this.heroIndex + 1) % total;
    if (reiniciarAutoplay) this.iniciarHeroAutoplay();
    refreshView(this.cd);
  }

  irAHero(index: number): void {
    if (index < 0 || index >= this.proximosHero.length) return;
    this.heroIndex = index;
    this.iniciarHeroAutoplay();
    refreshView(this.cd);
  }

  irASeccion(seccion: 'cartelera' | 'proximos' | 'candy'): void {
    this.seccionActiva = seccion;
    if (!isPlatformBrowser(this.platformId)) return;
    const el = document.getElementById(`seccion-${seccion}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    refreshView(this.cd);
  }

  private obtenerProximamente(todas: Pelicula[], vigentes: Pelicula[]): Pelicula[] {
    const hoy = this.inicioDelDia(new Date());
    const limite = new Date(hoy);
    limite.setDate(limite.getDate() + this.diasProximamente);

    const vigentesIds = new Set(vigentes.map(p => p.id));

    return todas
      .filter(p => {
        if (p.id != null && vigentesIds.has(p.id)) return false;
        const estreno = this.parseFechaLocal(p.fechaEstreno);
        if (!estreno) return false;
        return estreno > hoy && estreno <= limite;
      })
      .sort((a, b) => a.fechaEstreno.localeCompare(b.fechaEstreno));
  }

  private parseFechaLocal(fecha: string): Date | null {
    const parsed = new Date(`${fecha}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : this.inicioDelDia(parsed);
  }

  private inicioDelDia(fecha: Date): Date {
    const copia = new Date(fecha);
    copia.setHours(0, 0, 0, 0);
    return copia;
  }

  hayFiltrosActivos(): boolean {
    return !!this.filtroNombre.trim() || !!this.filtroGenero;
  }

  esPeliculaVigente(pelicula: Pelicula): boolean {
    const hoy = this.inicioDelDia(new Date());
    const estreno = this.parseFechaLocal(pelicula.fechaEstreno);
    const salida = this.parseFechaLocal(pelicula.fechaSalida);
    if (!estreno || !salida) return false;
    return estreno <= hoy && salida >= hoy;
  }

  esPeliculaProximamente(pelicula: Pelicula): boolean {
    if (this.esPeliculaVigente(pelicula)) return false;
    const hoy = this.inicioDelDia(new Date());
    const limite = new Date(hoy);
    limite.setDate(limite.getDate() + this.diasProximamente);
    const estreno = this.parseFechaLocal(pelicula.fechaEstreno);
    if (!estreno) return false;
    return estreno > hoy && estreno <= limite;
  }

  textoSinopsis(pelicula: Pelicula): string {
    const texto = pelicula.sinopsis?.trim();
    return texto
      || 'Sinopsis pendiente. Próximamente se publicará la descripción oficial de la película.';
  }

  private normalizarTexto(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private obtenerCatalogoBusqueda(): Pelicula[] {
    const porId = new Map<number, Pelicula>();
    for (const pelicula of [...this.peliculasVigentesBase, ...this.peliculasProximamenteBase]) {
      if (pelicula.id != null) {
        porId.set(pelicula.id, pelicula);
      }
    }
    return Array.from(porId.values());
  }

  private obtenerResultadosFiltrados(): Pelicula[] {
    const texto = this.normalizarTexto(this.filtroNombre);
    const genero = this.filtroGenero;

    return this.obtenerCatalogoBusqueda().filter(pelicula => {
      const nombre = this.normalizarTexto(pelicula.nombre || '');
      const coincideNombre = !texto || nombre.includes(texto);
      const coincideGenero = !genero || pelicula.genero === genero;
      return coincideNombre && coincideGenero;
    });
  }

  aplicarFiltrosLocales(): void {
    if (!this.hayFiltrosActivos()) {
      this.peliculasFiltradas = [];
      this.reiniciarPaginacion();
      refreshView(this.cd);
      return;
    }

    this.peliculasFiltradas = this.obtenerResultadosFiltrados();
    refreshView(this.cd);
  }

  limpiarFiltros(): void {
    this.filtroNombre = '';
    this.filtroGenero = '';
    this.generoAbierto = false;
    this.peliculasFiltradas = [];
    if (this.todasPeliculasBase.length || this.peliculasVigentesBase.length) {
      this.reiniciarPaginacion();
      this.peliculasProximamente = [...this.peliculasProximamenteBase];
      refreshView(this.cd);
      return;
    }
    this.cargarPeliculas();
  }

  /** Vuelve a la primera página de la cartelera. */
  private reiniciarPaginacion(): void {
    this.currentPage = 0;
    this.totalPages = Math.max(1, Math.ceil(this.peliculasVigentesBase.length / this.pageSize));
    this.peliculas = this.peliculasVigentesBase.slice(0, this.pageSize);
  }

  hasMore(): boolean {
    return this.currentPage < this.totalPages - 1;
  }

  /**
   * "Cargar más" con paginación del lado del cliente.
   *
   * El backend expone `/api/peliculas/vigentes` sin paginación, por lo que el
   * listado completo se descarga una vez y se va mostrando de a `pageSize`.
   */
  cargarMas(): void {
    if (this.loadingMore || !this.hasMore()) return;

    this.loadingMore = true;
    this.currentPage++;
    const desde = this.currentPage * this.pageSize;
    const nuevos = this.peliculasVigentesBase.slice(desde, desde + this.pageSize);

    this.peliculas = this.peliculas.concat(nuevos);
    this.loadingMore = false;
    refreshView(this.cd);
  }

  volver(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.history.back();
    }
  }

  irADetalle(peliculaId: number): void {
    this.router.navigate(['/pelicula', peliculaId]);
  }

  irAFunciones(peliculaId: number): void {
    autorizarButacas(peliculaId);
    this.router.navigate(['/butacas', peliculaId]);
  }

  onMovieImageError(id: number): void {
    console.warn('Error al cargar imagen de película ID:', id);
    this.imageErrorMap[id] = true;
    refreshView(this.cd);
  }

  iniciarPromoAutoplay(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.detenerPromoAutoplay();
    this.promoAutoplayId = setInterval(() => this.promoSiguiente(false), this.promoAutoplayMs);
  }

  detenerPromoAutoplay(): void {
    if (this.promoAutoplayId != null) {
      clearInterval(this.promoAutoplayId);
      this.promoAutoplayId = null;
    }
  }

  promoAnterior(): void {
    const total = this.promoSlides.length;
    this.promoIndex = (this.promoIndex - 1 + total) % total;
    this.iniciarPromoAutoplay();
    refreshView(this.cd);
  }

  promoSiguiente(reiniciarAutoplay = true): void {
    const total = this.promoSlides.length;
    this.promoIndex = (this.promoIndex + 1) % total;
    if (reiniciarAutoplay) this.iniciarPromoAutoplay();
    refreshView(this.cd);
  }

  irAPromo(index: number): void {
    this.promoIndex = index;
    this.iniciarPromoAutoplay();
    refreshView(this.cd);
  }

  get promoActual() {
    return this.promoSlides[this.promoIndex];
  }

  candyAnterior(): void {
    const total = this.candySlides.length;
    this.candyIndex = (this.candyIndex - 1 + total) % total;
    refreshView(this.cd);
  }

  candySiguiente(): void {
    const total = this.candySlides.length;
    this.candyIndex = (this.candyIndex + 1) % total;
    refreshView(this.cd);
  }

  irACandy(index: number): void {
    this.candyIndex = index;
    refreshView(this.cd);
  }
}

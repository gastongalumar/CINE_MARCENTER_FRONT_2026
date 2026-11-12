import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  afterNextRender,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { FuncionService } from '../../services/funcion';
import { AuthService } from '../../services/auth';
import { CompraFlujoService } from '../../services/compra-flujo.service';
import { Funcion } from '../../models/funcion';
import { refreshView } from '../../utils/refresh-view';
import { fechaLocalIso, parseApiDateTime } from '../../utils/datetime';
import { FechaApiPipe } from '../../pipes/fecha-api';
import { autorizarFuncion, limpiarFuncionAutorizada } from '../../utils/butacas-access';

export interface FuncionesPorDia {
  clave: string;
  funciones: Funcion[];
}

@Component({
  selector: 'app-compra-horarios',
  standalone: true,
  imports: [CommonModule, RouterModule, FechaApiPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './compra-horarios.html',
  styleUrls: ['./compra-flujo.shared.css'],
})
export class CompraHorariosComponent {
  private readonly initLoad = afterNextRender(() => {
    const id = this.route.snapshot.paramMap.get('peliculaId');
    this.peliculaId = id ? Number(id) : 0;
    this.esAdmin = this.authService.isAdmin();
    limpiarFuncionAutorizada();
    this.compraFlujo.setContexto(this.peliculaId, null);
    this.compraFlujo.clearSeleccion();
    this.cargarFunciones();
  });

  peliculaId = 0;
  funciones: Funcion[] = [];
  funcionesPorDia: FuncionesPorDia[] = [];
  diaSeleccionado = '';
  mostrandoOtrosDias = false;
  loadingFunciones = true;
  esAdmin = false;

  /** Disponibles calculados por funcionId (auth o DTO enriquecido). */
  readonly disponiblesPorFuncion: Record<number, number | null> = {};

  get nombrePelicula(): string {
    return this.funciones[0]?.peliculaNombre ?? '';
  }

  get hoyIso(): string {
    return fechaLocalIso();
  }

  get esDiaHoy(): boolean {
    return this.diaSeleccionado === this.hoyIso;
  }

  get hayFuncionesHoy(): boolean {
    return this.funcionesPorDia.some((g) => g.clave === this.hoyIso);
  }

  get hayOtrosDias(): boolean {
    return this.funcionesPorDia.some((g) => g.clave !== this.hoyIso);
  }

  get grupoSeleccionado(): FuncionesPorDia | null {
    return this.funcionesPorDia.find((g) => g.clave === this.diaSeleccionado) ?? null;
  }

  get funcionesDelDia(): Funcion[] {
    return this.grupoSeleccionado?.funciones ?? [];
  }

  get etiquetaAccionChip(): string {
    if (this.esAdmin) return 'Ver';
    if (!this.authService.isAuthenticated()) return 'Iniciar sesión';
    return 'Elegir';
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private funcionService: FuncionService,
    public authService: AuthService,
    private compraFlujo: CompraFlujoService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  cargarFunciones(): void {
    this.loadingFunciones = true;
    // GET /funciones/vigentes es público; evita 401 en /pelicula/{id} para guests.
    this.funcionService.listarVigentes().subscribe({
      next: (todas) => {
        this.funciones = (todas ?? [])
          .filter((f) => f.peliculaId === this.peliculaId)
          .filter((f) => !f.horario || new Date(f.horario).getTime() >= Date.now() - 60_000)
          .sort((a, b) => a.horario.localeCompare(b.horario));
        this.funcionesPorDia = this.agruparPorDia(this.funciones);
        this.inicializarDiaSeleccionado();
        this.mostrandoOtrosDias = false;
        this.loadingFunciones = false;
        this.enriquecerDisponibilidad(this.funciones);
        refreshView(this.cdr);
      },
      error: () => {
        this.funciones = [];
        this.funcionesPorDia = [];
        this.diaSeleccionado = '';
        this.mostrandoOtrosDias = false;
        this.loadingFunciones = false;
        refreshView(this.cdr);
      },
    });
  }

  textoDisponibles(funcion: Funcion): string {
    const n = this.disponiblesDe(funcion);
    if (n == null) {
      return this.authService.isAuthenticated()
        ? 'Sin datos de asientos'
        : 'Disponibilidad al elegir';
    }
    if (n <= 0) return 'Sin asientos libres';
    return `${n} asiento${n === 1 ? '' : 's'} disponible${n === 1 ? '' : 's'}`;
  }

  private disponiblesDe(funcion: Funcion): number | null {
    if (typeof funcion.asientosDisponibles === 'number' && Number.isFinite(funcion.asientosDisponibles)) {
      return Math.max(0, funcion.asientosDisponibles);
    }
    if (funcion.id == null) return null;
    const cached = this.disponiblesPorFuncion[funcion.id];
    return cached === undefined ? null : cached;
  }

  private capacidadDe(funcion: Funcion): number | null {
    if (typeof funcion.capacidad === 'number' && funcion.capacidad > 0) {
      return funcion.capacidad;
    }
    const filas = funcion.salaFilas ?? 0;
    const cols = funcion.salaColumnas ?? 0;
    const cap = filas * cols;
    return cap > 0 ? cap : null;
  }

  private enriquecerDisponibilidad(funciones: Funcion[]): void {
    for (const key of Object.keys(this.disponiblesPorFuncion)) {
      delete this.disponiblesPorFuncion[Number(key)];
    }

    // Preferir campos del DTO si el backend ya los envía.
    let pendingAuthFetch = false;
    for (const f of funciones) {
      if (f.id == null) continue;
      if (typeof f.asientosDisponibles === 'number' && Number.isFinite(f.asientosDisponibles)) {
        this.disponiblesPorFuncion[f.id] = Math.max(0, f.asientosDisponibles);
        continue;
      }
      pendingAuthFetch = true;
    }

    if (!pendingAuthFetch || !this.authService.isAuthenticated()) {
      refreshView(this.cdr);
      return;
    }

    const requests = funciones
      .filter((f) => f.id != null && this.disponiblesPorFuncion[f.id!] === undefined)
      .map((f) => {
        const id = f.id!;
        const capacidad = this.capacidadDe(f);
        return this.funcionService.obtenerEstadoAsientos(id).pipe(
          map((estado) => {
            const tomados =
              (estado.ocupados?.length ?? 0) + (estado.bloqueados?.length ?? 0);
            if (capacidad == null) {
              return { id, libres: null as number | null };
            }
            return { id, libres: Math.max(0, capacidad - tomados) };
          }),
          catchError(() =>
            this.funcionService.obtenerAsientosOcupados(id).pipe(
              map((ocupados) => {
                if (capacidad == null) {
                  return { id, libres: null as number | null };
                }
                return { id, libres: Math.max(0, capacidad - (ocupados?.length ?? 0)) };
              }),
              catchError(() => of({ id, libres: null as number | null }))
            )
          )
        );
      });

    if (requests.length === 0) {
      refreshView(this.cdr);
      return;
    }

    forkJoin(requests).subscribe((resultados) => {
      for (const r of resultados) {
        this.disponiblesPorFuncion[r.id] = r.libres;
      }
      refreshView(this.cdr);
    });
  }

  private inicializarDiaSeleccionado(): void {
    const hoy = this.hoyIso;
    if (this.funcionesPorDia.some((g) => g.clave === hoy)) {
      this.diaSeleccionado = hoy;
      return;
    }
    this.diaSeleccionado = '';
  }

  private agruparPorDia(funciones: Funcion[]): FuncionesPorDia[] {
    const porDia = new Map<string, Funcion[]>();

    for (const funcion of funciones) {
      const fecha = parseApiDateTime(funcion.horario);
      const clave = fecha ? fechaLocalIso(fecha) : (funcion.horario?.slice(0, 10) ?? 'sin-fecha');
      const grupo = porDia.get(clave);
      if (grupo) {
        grupo.push(funcion);
      } else {
        porDia.set(clave, [funcion]);
      }
    }

    return [...porDia.entries()].map(([clave, items]) => ({ clave, funciones: items }));
  }

  toggleOtrosDias(): void {
    this.mostrandoOtrosDias = !this.mostrandoOtrosDias;
    refreshView(this.cdr);
  }

  elegirDia(clave: string): void {
    this.diaSeleccionado = clave;
    this.mostrandoOtrosDias = false;
    refreshView(this.cdr);
  }

  volverAHoy(): void {
    if (!this.hayFuncionesHoy) return;
    this.diaSeleccionado = this.hoyIso;
    this.mostrandoOtrosDias = false;
    refreshView(this.cdr);
  }

  elegirFuncion(funcion: Funcion): void {
    if (funcion.id == null) {
      this.toastr.error('Seleccione una función válida.', 'Error');
      return;
    }

    this.compraFlujo.clear();
    this.compraFlujo.setContexto(this.peliculaId, funcion.id);
    autorizarFuncion(funcion.id);

    const asientosUrl = `/butacas/${this.peliculaId}/funcion/${funcion.id}`;
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: asientosUrl } });
      return;
    }

    this.router.navigate(['/butacas', this.peliculaId, 'funcion', funcion.id]);
  }

  volver(): void {
    this.router.navigate(['/cartelera']);
  }
}

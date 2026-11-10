import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  afterNextRender,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
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
    this.funcionService.listarPorPelicula(this.peliculaId).subscribe({
      next: (funciones) => {
        this.funciones = (funciones ?? [])
          .filter((f) => !f.horario || new Date(f.horario).getTime() >= Date.now() - 60_000)
          .sort((a, b) => a.horario.localeCompare(b.horario));
        this.funcionesPorDia = this.agruparPorDia(this.funciones);
        this.inicializarDiaSeleccionado();
        this.mostrandoOtrosDias = false;
        this.loadingFunciones = false;
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
    this.router.navigate(['/butacas', this.peliculaId, 'funcion', funcion.id]);
  }

  volver(): void {
    this.router.navigate(['/cartelera']);
  }
}

import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  RegistroRequest,
  TipoUsuario,
  esStaff,
  parseTipoUsuario,
} from '../models/auth';
import { decodeJwtPayload, isJwtExpired } from '../utils/jwt';

/** Clave del token aislado por pestaña en sessionStorage. */
export const TOKEN_STORAGE_KEY = 'access_token';

/** Foto de perfil en localStorage (sobrevive hasta el próximo login/logout). */
const FOTO_PERFIL_STORAGE_KEY = 'foto_perfil_url';

/**
 * Servicio de autenticación.
 *
 * - Persiste el JWT en `sessionStorage` para aislar las sesiones por pestaña.
 * - Decodifica el payload para conocer el rol (`tipo`) del usuario.
 * - Expone el estado de sesión con **signals** (`currentUser`, `token`,
 *   `isAuthenticated`, `isAdmin`, `isSuperAdmin`, `isCliente`).
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private readonly _currentUser = signal<AuthResponse | null>(null);
  private readonly _token = signal<string | null>(null);

  /** Usuario de la sesión actual (null si no hay sesión). */
  readonly currentUser = this._currentUser.asReadonly();

  /** Token JWT vigente (null si no hay sesión). */
  readonly token = this._token.asReadonly();

  /** Rol del usuario autenticado. */
  readonly role = computed<TipoUsuario | null>(() => this._currentUser()?.tipo ?? null);

  /** true si hay token guardado y el mismo no expiró. */
  readonly isAuthenticated = computed(() => {
    const token = this._token();
    return !!token && !isJwtExpired(token);
  });

  /** true si es ADMINISTRADOR o SUPERADMIN (acceso al panel). */
  readonly isAdmin = computed(() => esStaff(this.role()));

  /** true si es SUPERADMIN (gestión de staff). */
  readonly isSuperAdmin = computed(() => this.role() === 'SUPERADMIN');

  /** true si el usuario autenticado es cliente. */
  readonly isCliente = computed(() => this.role() === 'CLIENTE');

  constructor() {
    if (this.isBrowser) {
      this.restaurarSesion();
    }
  }

  // ---------------------------------------------------------------------
  // Sesión
  // ---------------------------------------------------------------------

  /** Recupera la sesión guardada en esta pestaña (si el token sigue vigente). */
  private restaurarSesion(): void {
    const token = this.getToken();
    if (!token || isJwtExpired(token)) {
      this.limpiarStorage();
      return;
    }

    const claims = decodeJwtPayload(token);
    const tipo = parseTipoUsuario(claims?.tipo);
    const nombreCompleto =
      (claims?.nombreCompleto || '').trim() ||
      `${claims?.nombre ?? ''} ${claims?.apellido ?? ''}`.trim() ||
      claims?.sub ||
      '';

    const fotoGuardada = this.leerFotoStorage();
    this._token.set(token);
    this._currentUser.set({
      token,
      tipo,
      email: claims?.sub ?? '',
      nombre: nombreCompleto,
      id: claims?.userId ?? 0,
      fotoPerfilUrl: fotoGuardada || claims?.fotoPerfilUrl || null,
    });
  }

  /** Inicia sesión. `POST /api/auth/login`. */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => this.guardarSesion(response))
    );
  }

  /** Registra un cliente e inicia sesión automáticamente. `POST /api/auth/registro`. */
  registro(data: RegistroRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/registro`, data).pipe(
      tap((response) => this.guardarSesion(response))
    );
  }

  /**
   * Crea un administrador o superadmin. `POST /api/auth/registro-admin`.
   * Solo SUPERADMIN. NO cambia la sesión actual.
   */
  registrarAdmin(data: RegistroRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/registro-admin`, data);
  }

  /** Cierra sesión y limpia el estado. */
  logout(): void {
    this.limpiarStorage();
    this._token.set(null);
    this._currentUser.set(null);
  }

  // ---------------------------------------------------------------------
  // Lectores
  // ---------------------------------------------------------------------

  /** Token JWT guardado (null si no hay). */
  getToken(): string | null {
    if (!this.isBrowser) return this._token();
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
  }

  /** Usuario de la sesión actual (null si no hay). */
  getCurrentUser(): AuthResponse | null {
    return this._currentUser();
  }

  /** Rol del usuario autenticado (null si no hay sesión). */
  getTipoUsuario(): TipoUsuario | null {
    return this.role();
  }

  /** Id del usuario autenticado (0 si no se pudo determinar). */
  getUserId(): number {
    const user = this._currentUser();
    if (user?.id) return Number(user.id);

    const claims = decodeJwtPayload(this.getToken());
    return claims?.userId ? Number(claims.userId) : 0;
  }

  /** true si el usuario tiene al menos uno de los roles indicados. */
  tieneRol(...roles: TipoUsuario[]): boolean {
    const actual = this.role();
    return !!actual && roles.includes(actual);
  }

  /** Actualiza el nombre visible del usuario en la sesión (sin tocar el backend). */
  updateDisplayName(nombre: string, apellido: string): void {
    const actual = this._currentUser();
    if (!actual) return;

    const nombreCompleto = `${nombre} ${apellido}`.trim();
    this._currentUser.set({ ...actual, nombre: nombreCompleto });
  }

  /** Actualiza la foto de perfil en la sesión local. */
  updateFotoPerfil(fotoPerfilUrl: string | null | undefined): void {
    const actual = this._currentUser();
    if (!actual) return;
    const foto = fotoPerfilUrl || null;
    this._currentUser.set({ ...actual, fotoPerfilUrl: foto });
    this.guardarFotoStorage(foto);
  }

  // ---------------------------------------------------------------------
  // Internos
  // ---------------------------------------------------------------------

  private guardarSesion(response: AuthResponse): void {
    if (this.isBrowser && response?.token) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, response.token);
    }
    const normalizado: AuthResponse | null = response
      ? { ...response, tipo: parseTipoUsuario(response.tipo) }
      : null;
    this._token.set(normalizado?.token ?? null);
    this._currentUser.set(normalizado);
    this.guardarFotoStorage(normalizado?.fotoPerfilUrl || null);
  }

  private guardarFotoStorage(fotoPerfilUrl: string | null): void {
    if (!this.isBrowser) return;
    try {
      if (fotoPerfilUrl) {
        localStorage.setItem(FOTO_PERFIL_STORAGE_KEY, fotoPerfilUrl);
      } else {
        localStorage.removeItem(FOTO_PERFIL_STORAGE_KEY);
      }
    } catch {
      // localStorage puede no estar disponible (modo privado): se ignora.
    }
  }

  private leerFotoStorage(): string | null {
    if (!this.isBrowser) return null;
    try {
      return localStorage.getItem(FOTO_PERFIL_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private limpiarStorage(): void {
    if (!this.isBrowser) return;
    try {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(FOTO_PERFIL_STORAGE_KEY);
    } catch {
      // localStorage puede no estar disponible (modo privado): se ignora.
    }
  }
}

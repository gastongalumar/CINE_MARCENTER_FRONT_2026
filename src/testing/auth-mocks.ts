import { signal, computed, type WritableSignal, type Signal } from '@angular/core';
import type { AuthResponse, TipoUsuario } from '../app/models/auth';
import { esStaff } from '../app/models/auth';

export interface AuthServiceMock {
  currentUser: Signal<AuthResponse | null>;
  token: Signal<string | null>;
  role: Signal<TipoUsuario | null>;
  isAuthenticated: WritableSignal<boolean> | Signal<boolean>;
  isAdmin: WritableSignal<boolean> | Signal<boolean>;
  isSuperAdmin: Signal<boolean>;
  isCliente: Signal<boolean>;
  getToken: ReturnType<typeof vi.fn>;
  getCurrentUser: ReturnType<typeof vi.fn>;
  getTipoUsuario: ReturnType<typeof vi.fn>;
  getUserId: ReturnType<typeof vi.fn>;
  tieneRol: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
  login: ReturnType<typeof vi.fn>;
  registro: ReturnType<typeof vi.fn>;
  _setUser: (user: AuthResponse | null) => void;
  _setAuthenticated: (value: boolean) => void;
  _setAdmin: (value: boolean) => void;
}

/** Stub ligero de AuthService basado en signals (para guards/componentes). */
export function createAuthServiceMock(overrides: Partial<{
  authenticated: boolean;
  role: TipoUsuario | null;
  token: string | null;
  user: AuthResponse | null;
}> = {}): AuthServiceMock {
  const userSignal = signal<AuthResponse | null>(overrides.user ?? null);
  const tokenSignal = signal<string | null>(overrides.token ?? null);
  const isAuthenticated = signal(overrides.authenticated ?? false);
  const roleSignal = signal<TipoUsuario | null>(overrides.role ?? null);

  const isAdmin = computed(() => esStaff(roleSignal()));
  const isSuperAdmin = computed(() => roleSignal() === 'SUPERADMIN');
  const isCliente = computed(() => roleSignal() === 'CLIENTE');

  const mock: AuthServiceMock = {
    currentUser: userSignal.asReadonly(),
    token: tokenSignal.asReadonly(),
    role: roleSignal.asReadonly(),
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    isCliente,
    getToken: vi.fn(() => tokenSignal()),
    getCurrentUser: vi.fn(() => userSignal()),
    getTipoUsuario: vi.fn(() => roleSignal()),
    getUserId: vi.fn(() => userSignal()?.id ?? 0),
    tieneRol: vi.fn((...roles: TipoUsuario[]) => {
      const actual = roleSignal();
      return !!actual && roles.includes(actual);
    }),
    logout: vi.fn(),
    login: vi.fn(),
    registro: vi.fn(),
    _setUser: (user) => {
      userSignal.set(user);
      roleSignal.set(user?.tipo ?? null);
      tokenSignal.set(user?.token ?? null);
    },
    _setAuthenticated: (value) => isAuthenticated.set(value),
    _setAdmin: (value) => {
      roleSignal.set(value ? 'ADMINISTRADOR' : 'CLIENTE');
    },
  };

  return mock;
}

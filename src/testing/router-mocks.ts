import type { UrlTree } from '@angular/router';

export interface RouterMock {
  createUrlTree: ReturnType<typeof vi.fn>;
  navigate: ReturnType<typeof vi.fn>;
  navigateByUrl: ReturnType<typeof vi.fn>;
  parseUrl: ReturnType<typeof vi.fn>;
  url: string;
}

/** Router stub compatible con guards (createUrlTree → { commands, queryParams }). */
export function createRouterMock(url = '/'): RouterMock {
  return {
    url,
    createUrlTree: vi.fn((commands: unknown[], extras?: { queryParams?: Record<string, unknown> }) =>
      ({ commands, queryParams: extras?.queryParams ?? {} }) as unknown as UrlTree
    ),
    navigate: vi.fn().mockResolvedValue(true),
    navigateByUrl: vi.fn().mockResolvedValue(true),
    parseUrl: vi.fn((u: string) => ({ toString: () => u })),
  };
}

export function createToastrMock() {
  return {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  };
}

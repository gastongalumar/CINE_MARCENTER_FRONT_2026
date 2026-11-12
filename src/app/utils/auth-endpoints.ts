/** Endpoints de auth públicos (sin Bearer). registro-admin NO es público. */
export function isPublicAuthEndpoint(url: string): boolean {
  return (
    /\/auth\/login$/.test(url) ||
    /\/auth\/registro$/.test(url) ||
    /\/auth\/forgot-password$/.test(url) ||
    /\/auth\/reset-password$/.test(url)
  );
}

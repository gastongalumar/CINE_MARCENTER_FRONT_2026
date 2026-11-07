export function getErrorMessage(error: any, fallback = 'Ocurrió un error.'):
  string {
  const message =
    error?.error?.message ??
    error?.message ??
    error?.error?.error ??
    error?.statusText ??
    '';

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  return fallback;
}

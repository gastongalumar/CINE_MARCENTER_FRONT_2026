export const environment = {
  production: true,
  // En Docker el frontend y la API se sirven desde el mismo origen:
  // Nginx hace de proxy hacia el backend. Por eso las rutas son relativas.
  apiUrl: '/api',
  baseUrl: '',
};

/** Respuesta de error del backend (ErrorResponse). */
export interface FieldError {
  field: string;
  message: string;
}

export interface ErrorResponse {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  fieldErrors?: FieldError[];
}

/** Error normalizado que viajan por el interceptor hacia los componentes. */
export interface ApiError {
  message: string;
  fieldErrors?: FieldError[];
  fieldErrorsMap?: Record<string, string>;
  status?: number;
  original?: unknown;
}

export interface HoldRequest {
  funcionId: number;
  etiqueta: string;
}

export interface HoldResponse extends HoldRequest {
  id: number;
  expiresAt: string;
}

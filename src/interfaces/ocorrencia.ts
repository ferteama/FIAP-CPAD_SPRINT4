import { NivelRisco } from "../types/nivelRisco";

/** Como a classificação da ocorrência foi obtida. */
export type OrigemRegistro = "api" | "offline" | "manual" | "mock";

export interface Ocorrencia {
  /** String (não número): evita colisão de IDs entre aparelhos diferentes no Firebase. */
  id: string;
  descricao: string;
  local: string;
  risco: NivelRisco;
  /** dd/mm/aaaa */
  data: string;
  alturaGrama: string;
  distancia: string;
  previsaoCorte: string;
  clima: string;
  /** Foto local (file://) — não é enviada ao Firestore, fica só no aparelho. */
  fotoUri?: string;
  origem?: OrigemRegistro;
  criadoPor?: string;
}

import { NivelRisco } from "../types/nivelRisco";

/**
 * Registro permanente de uma roçada executada. É o "histórico de
 * intervenções" do trecho: nunca é apagado, mesmo depois que a ocorrência
 * ativa deixa a lista de monitoramento.
 */
export interface Intervencao {
  id: string;
  /** Ocorrência que originou o corte (serve de "lápide" na sincronização). */
  ocorrenciaId: string;
  local: string;
  /** Estado do trecho ANTES do corte. */
  riscoAntes: NivelRisco;
  alturaAntes: string;
  /** dd/mm/aaaa em que a ocorrência foi detectada. */
  dataDeteccao: string;
  /** dd/mm/aaaa em que o corte foi executado. */
  dataCorte: string;
  /** Epoch ms do registro — usado para ordenar o histórico. */
  timestamp: number;
  responsavel: string;
  observacao?: string;
  origem?: "mock" | "app";
}

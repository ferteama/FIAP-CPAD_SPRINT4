import { NivelRisco } from "../types/nivelRisco";

export interface Ocorrencia {
  id: number;
  descricao: string;
  local: string;
  risco: NivelRisco;
  data: string;
  alturaGrama: string;
  distancia: string;
  previsaoCorte: string;
  clima: string;
  fotoUri?: string;
}

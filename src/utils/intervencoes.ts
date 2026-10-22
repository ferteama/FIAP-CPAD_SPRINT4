import { Ocorrencia } from "../interfaces/ocorrencia";
import { Intervencao } from "../interfaces/intervencao";
import { formatarDataBR } from "./datas";
import { gerarId } from "./formatadores";

/**
 * Monta o registro permanente de uma roçada a partir da ocorrência ativa.
 * Função pura (recebe "agora") para ser testada sem React.
 */
export function criarIntervencao(
  ocorrencia: Ocorrencia,
  responsavel: string,
  observacao: string | undefined,
  agora: Date = new Date()
): Intervencao {
  const obs = observacao?.trim();
  return {
    id: gerarId("iv"),
    ocorrenciaId: ocorrencia.id,
    local: ocorrencia.local,
    riscoAntes: ocorrencia.risco,
    alturaAntes: ocorrencia.alturaGrama,
    dataDeteccao: ocorrencia.data,
    dataCorte: formatarDataBR(agora),
    timestamp: agora.getTime(),
    responsavel: responsavel.trim() || "Operador",
    observacao: obs ? obs : undefined,
    // Cortar um trecho de demonstração não deve poluir o banco real
    origem: ocorrencia.origem === "mock" ? "mock" : "app",
  };
}

/**
 * vegetationApi.ts
 * ─────────────────────────────────────────────────────────────
 * Camada de comunicação entre o app (câmera) e a API de análise
 * de vegetação (OpenCV + modelo de previsão no backend Python).
 *
 * Fluxo:
 *   1. Usuário tira foto (expo-image-picker, já implementado em CadastroScreen.tsx)
 *   2. App envia a foto via multipart/form-data para a API
 *   3. API roda a segmentação (OpenCV) + estimativa de altura e devolve JSON
 *   4. App usa o resultado para preencher o registro (Ocorrencia)
 *
 * Configuração:
 *   Defina EXPO_PUBLIC_API_URL no .env (veja .env.example).
 *   Em desenvolvimento local, use o IP da sua máquina na rede
 *   (não "localhost" — o celular/emulador não enxerga localhost do seu PC).
 */

import { NivelRisco } from "../types/nivelRisco";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.0.10:8000";

export type ResultadoAnalise = {
  alturaCm: number;
  coberturaPercentual: number;
  risco: NivelRisco;
  previsaoDiasProximoCorte: number;
};

export class VegetationApiError extends Error {}

/**
 * Envia a foto capturada para a API de análise e retorna a
 * altura estimada da vegetação, cobertura e classificação de risco.
 *
 * @param fotoUri  URI local da foto (retornada pelo expo-image-picker)
 * @param local    Identificação do ponto monitorado (ex: "KM 42 — Norte")
 */
export async function analisarFotoVegetacao(
  fotoUri: string,
  local: string
): Promise<ResultadoAnalise> {
  const formData = new FormData();

  // React Native aceita esse formato "pseudo-File" para multipart/form-data.
  // O nome/tipo do arquivo importam para o backend conseguir decodificar a imagem.
  formData.append("foto", {
    uri: fotoUri,
    name: "vegetacao.jpg",
    type: "image/jpeg",
  } as any);
  formData.append("local", local);

  let response: Response;
  try {
    response = await fetch(`${API_URL}/analisar`, {
      method: "POST",
      body: formData,
      headers: {
        // NÃO defina "Content-Type" manualmente aqui — o fetch precisa
        // gerar o boundary do multipart sozinho. Definir na mão quebra o upload.
        Accept: "application/json",
      },
    });
  } catch (err) {
    throw new VegetationApiError(
      "Não foi possível conectar à API de análise. Verifique sua conexão e o endereço configurado."
    );
  }

  if (!response.ok) {
    const texto = await response.text().catch(() => "");
    throw new VegetationApiError(
      `API retornou erro (${response.status}). ${texto}`.trim()
    );
  }

  const data = await response.json();

  return {
    alturaCm: data.altura_cm,
    coberturaPercentual: data.cobertura_percentual,
    risco: data.risco as NivelRisco,
    previsaoDiasProximoCorte: data.previsao_dias_proximo_corte,
  };
}

/**
 * Fallback local, sem rede — útil para testar a tela sem o backend
 * rodando, ou como plano B se a API cair durante a gravação do vídeo.
 * Não faz nenhuma análise real, apenas simula uma resposta plausível.
 */
export function analisarFotoVegetacaoSimulado(): ResultadoAnalise {
  const cobertura = Math.round(20 + Math.random() * 60);
  const risco: NivelRisco =
    cobertura >= 55 ? "alto" : cobertura >= 30 ? "medio" : "baixo";
  const alturaCm =
    risco === "alto" ? 16 + Math.random() * 6 :
    risco === "medio" ? 8 + Math.random() * 8 :
    2 + Math.random() * 6;

  return {
    alturaCm: Math.round(alturaCm * 10) / 10,
    coberturaPercentual: cobertura,
    risco,
    previsaoDiasProximoCorte: risco === "alto" ? 0 : risco === "medio" ? 4 : 12,
  };
}

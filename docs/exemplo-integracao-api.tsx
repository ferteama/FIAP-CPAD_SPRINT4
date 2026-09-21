/**
 * EXEMPLO DE USO — não é importado em lugar nenhum do app.
 * ─────────────────────────────────────────────────────────────
 * Mostra como plugar `analisarFotoVegetacao` dentro do handleEnviar()
 * de CadastroScreen.tsx, no lugar dos valores simulados que já existem
 * (alturaEstimada, previsaoCorte etc.).
 *
 * Antes (CadastroScreen.tsx, dentro de handleEnviar):
 *
 *   await adicionarOcorrencia({
 *     local: localCompleto,
 *     descricao: descricaoSugerida(risco, localCompleto),
 *     risco,
 *     data: dataHoje(),
 *     alturaGrama: alturaEstimada(risco),
 *     distancia: distanciaSimulada(),
 *     previsaoCorte: previsaoCorte(risco),
 *     clima: climaSimulado(),
 *     fotoUri: fotoUri ?? undefined,
 *   });
 *
 * Depois — com a API real de análise:
 */

import { analisarFotoVegetacao, analisarFotoVegetacaoSimulado, VegetationApiError } from "../src/services/vegetationApi";

async function exemploHandleEnviarComApi(
  fotoUri: string | null,
  localCompleto: string,
  adicionarOcorrencia: (dados: any) => Promise<void>,
  onSucesso: () => void
) {
  if (!fotoUri) return;

  try {
    // 1. Envia a foto para a API (OpenCV + modelo rodando no backend)
    const resultado = await analisarFotoVegetacao(fotoUri, localCompleto);

    // 2. Usa o resultado real da análise no lugar dos valores simulados
    await adicionarOcorrencia({
      local: localCompleto,
      descricao: `Altura estimada: ${resultado.alturaCm}cm (cobertura ${resultado.coberturaPercentual}%)`,
      risco: resultado.risco,
      data: new Date().toLocaleDateString("pt-BR"),
      alturaGrama: `${resultado.alturaCm}cm`,
      previsaoCorte: `${resultado.previsaoDiasProximoCorte} dia(s)`,
      fotoUri,
    });

    onSucesso();
  } catch (err) {
    // 3. Se a API estiver fora do ar (ex: durante a gravação do vídeo),
    //    cai no modo simulado em vez de travar a demonstração.
    if (err instanceof VegetationApiError) {
      const resultadoSimulado = analisarFotoVegetacaoSimulado();
      await adicionarOcorrencia({
        local: localCompleto,
        descricao: `[modo offline] Altura estimada: ${resultadoSimulado.alturaCm}cm`,
        risco: resultadoSimulado.risco,
        data: new Date().toLocaleDateString("pt-BR"),
        alturaGrama: `${resultadoSimulado.alturaCm}cm`,
        previsaoCorte: `${resultadoSimulado.previsaoDiasProximoCorte} dia(s)`,
        fotoUri,
      });
      onSucesso();
    }
  }
}

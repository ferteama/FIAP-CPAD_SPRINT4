/**
 * exportacaoService.ts — entrega os arquivos gerados em utils/exportacao.ts:
 *  - Mobile: grava em cache e abre a folha de compartilhamento do sistema
 *  - Web: baixa o arquivo / abre a janela de impressão
 */

import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";

import { Ocorrencia } from "../interfaces/ocorrencia";
import { Intervencao } from "../interfaces/intervencao";
import { gerarCsvIntervencoes, gerarCsvOcorrencias, gerarHtmlRelatorio } from "../utils/exportacao";

function baixarNaWeb(conteudo: string, nome: string, mime: string) {
  const blob = new Blob([conteudo], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

async function compartilharArquivo(conteudo: string, nome: string, mime: string, titulo: string) {
  if (Platform.OS === "web") {
    baixarNaWeb(conteudo, nome, mime);
    return;
  }
  const arquivo = new File(Paths.cache, nome);
  if (arquivo.exists) arquivo.delete();
  arquivo.create();
  arquivo.write(conteudo);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Compartilhamento indisponível neste dispositivo.");
  }
  await Sharing.shareAsync(arquivo.uri, { mimeType: mime, dialogTitle: titulo });
}

export async function exportarCsvOcorrencias(ocorrencias: Ocorrencia[]) {
  await compartilharArquivo(gerarCsvOcorrencias(ocorrencias), "trechos-monitorados.csv", "text/csv", "Exportar trechos");
}

export async function exportarCsvIntervencoes(intervencoes: Intervencao[]) {
  await compartilharArquivo(gerarCsvIntervencoes(intervencoes), "historico-intervencoes.csv", "text/csv", "Exportar histórico");
}

export async function exportarPdf(ocorrencias: Ocorrencia[], intervencoes: Intervencao[], geradoPor: string) {
  const html = gerarHtmlRelatorio(ocorrencias, intervencoes, geradoPor);
  if (Platform.OS === "web") {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Compartilhamento indisponível neste dispositivo.");
  }
  await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Relatório de monitoramento", UTI: "com.adobe.pdf" });
}

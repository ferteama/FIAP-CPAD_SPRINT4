import { Ocorrencia } from "../interfaces/ocorrencia";
import { Intervencao } from "../interfaces/intervencao";
import { RISCO_ROTULO } from "./rotulos";
import {
  LIMITE_REGULATORIO_CM,
  alturaMediaCm,
  contarPorRisco,
  indiceConformidade,
  intervencoesNoMes,
  tempoMedioAtendimentoDias,
} from "./estatisticas";
import { diasEntre, formatarDataBR } from "./datas";

/**
 * exportacao.ts — geração (pura) dos conteúdos exportáveis do Relatório:
 * CSV de trechos, CSV de histórico de intervenções e HTML para o PDF.
 * A parte que toca em arquivos/compartilhamento está em services/exportacaoService.ts.
 */

const SEP = ";"; // Excel em pt-BR abre CSV separado por ponto e vírgula
const BOM = "\uFEFF"; // garante acentos corretos no Excel

export function escaparCsv(valor: string | number | undefined | null): string {
  const texto = valor === undefined || valor === null ? "" : String(valor);
  // Neutraliza "injeção de fórmula" em planilhas (=, +, -, @ no início)
  const seguro = /^[=+\-@]/.test(texto) ? `'${texto}` : texto;
  return /[";\n\r]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro;
}

function linhaCsv(campos: (string | number | undefined | null)[]): string {
  return campos.map(escaparCsv).join(SEP);
}

export function gerarCsvOcorrencias(ocorrencias: Ocorrencia[]): string {
  const cab = linhaCsv(["Trecho", "Data de detecção", "Risco", "Altura", "Previsão de corte", "Clima", "Origem", "Registrado por", "Descrição"]);
  const linhas = ocorrencias.map((o) =>
    linhaCsv([o.local, o.data, RISCO_ROTULO[o.risco], o.alturaGrama, o.previsaoCorte, o.clima, o.origem ?? "", o.criadoPor ?? "", o.descricao])
  );
  return BOM + [cab, ...linhas].join("\r\n");
}

export function gerarCsvIntervencoes(intervencoes: Intervencao[]): string {
  const cab = linhaCsv(["Trecho", "Data de detecção", "Data do corte", "Dias até o corte", "Risco antes", "Altura antes", "Responsável", "Observação"]);
  const linhas = intervencoes.map((i) =>
    linhaCsv([i.local, i.dataDeteccao, i.dataCorte, diasEntre(i.dataDeteccao, i.dataCorte) ?? "", RISCO_ROTULO[i.riscoAntes], i.alturaAntes, i.responsavel, i.observacao ?? ""])
  );
  return BOM + [cab, ...linhas].join("\r\n");
}

export function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function gerarHtmlRelatorio(
  ocorrencias: Ocorrencia[],
  intervencoes: Intervencao[],
  geradoPor: string,
  hoje: Date = new Date()
): string {
  const c = contarPorRisco(ocorrencias);
  const tma = tempoMedioAtendimentoDias(intervencoes);
  const e = escaparHtml;

  const linhasTrechos = ocorrencias
    .map(
      (o) => `<tr><td>${e(o.local)}</td><td>${e(o.data)}</td><td>${e(o.alturaGrama)}</td><td>${e(RISCO_ROTULO[o.risco])}</td><td>${e(o.previsaoCorte)}</td></tr>`
    )
    .join("");
  const linhasHistorico = intervencoes
    .map((i) => {
      const dias = diasEntre(i.dataDeteccao, i.dataCorte);
      return `<tr><td>${e(i.local)}</td><td>${e(i.dataCorte)}</td><td>${dias ?? "-"}</td><td>${e(i.alturaAntes)}</td><td>${e(i.responsavel)}</td><td>${e(i.observacao ?? "")}</td></tr>`;
    })
    .join("");

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8" />
<style>
  body{font-family:Helvetica,Arial,sans-serif;color:#1C2536;padding:24px;font-size:12px}
  h1{color:#2F6B4C;font-size:20px;margin:0 0 4px} h2{color:#1B3A57;font-size:14px;margin:22px 0 8px}
  .sub{color:#7C8B96;margin-bottom:16px}
  .kpis{display:flex;gap:10px;flex-wrap:wrap}
  .kpi{border:1px solid #E3E8E5;border-radius:8px;padding:8px 12px;min-width:110px}
  .kpi b{display:block;font-size:18px}
  table{width:100%;border-collapse:collapse} th{background:#2F6B4C;color:#fff;text-align:left}
  th,td{padding:6px 8px;border-bottom:1px solid #E3E8E5}
</style></head><body>
<h1>Relatório de Monitoramento de Vegetação</h1>
<div class="sub">Drone Vision Watch · Motiva · BR-101 — gerado em ${formatarDataBR(hoje)} por ${e(geradoPor)}</div>
<div class="kpis">
  <div class="kpi"><b>${ocorrencias.length}</b>trechos monitorados</div>
  <div class="kpi"><b>${c.alto}</b>risco alto</div>
  <div class="kpi"><b>${c.medio}</b>risco médio</div>
  <div class="kpi"><b>${c.baixo}</b>risco baixo</div>
  <div class="kpi"><b>${alturaMediaCm(ocorrencias)}cm</b>altura média</div>
  <div class="kpi"><b>${indiceConformidade(ocorrencias)}%</b>conformidade (≤ ${LIMITE_REGULATORIO_CM}cm)</div>
  <div class="kpi"><b>${intervencoesNoMes(intervencoes, hoje)}</b>roçadas no mês</div>
  <div class="kpi"><b>${tma === null ? "-" : tma + " d"}</b>tempo médio de atendimento</div>
</div>
<h2>Trechos em monitoramento</h2>
${ocorrencias.length === 0 ? "<p>Nenhum trecho em monitoramento.</p>" : `<table><tr><th>Trecho</th><th>Detectado em</th><th>Altura</th><th>Risco</th><th>Previsão de corte</th></tr>${linhasTrechos}</table>`}
<h2>Histórico de intervenções</h2>
${intervencoes.length === 0 ? "<p>Nenhuma intervenção registrada.</p>" : `<table><tr><th>Trecho</th><th>Corte em</th><th>Dias até o corte</th><th>Altura antes</th><th>Responsável</th><th>Observação</th></tr>${linhasHistorico}</table>`}
</body></html>`;
}

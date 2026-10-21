import { Ocorrencia } from "../interfaces/ocorrencia";
import { Intervencao } from "../interfaces/intervencao";
import { NivelRisco } from "../types/nivelRisco";
import { diasEntre, diasDesde, parseDataBR } from "./datas";

/**
 * estatisticas.ts
 * ─────────────────────────────────────────────────────────────
 * Funções puras que transformam a lista de ocorrências em métricas
 * para o Dashboard (DashboardScreen) e para o Relatório (RelatorioScreen).
 * Nenhuma delas depende de estado do React — só recebem `Ocorrencia[]`.
 */

// Limite regulatório de altura de grama usado na regra de negócio
// já presente em formatadores.ts (descricaoSugerida): 10cm.
export const LIMITE_REGULATORIO_CM = 10;

/** Extrai o número de dentro de uma string como "16cm" → 16. */
export function parseNumero(valor: string): number {
  const match = valor.replace(",", ".").match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

/** "KM 42 — Norte" → 42 (usado para ordenar "Por KM"). */
export function parseKm(local: string): number {
  const match = local.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

export type ContagemPorRisco = Record<NivelRisco, number>;

export function contarPorRisco(ocorrencias: Ocorrencia[]): ContagemPorRisco {
  return ocorrencias.reduce(
    (acc, o) => {
      acc[o.risco] += 1;
      return acc;
    },
    { alto: 0, medio: 0, baixo: 0 } as ContagemPorRisco
  );
}

/** Altura média (em cm) de todas as ocorrências monitoradas. */
export function alturaMediaCm(ocorrencias: Ocorrencia[]): number {
  if (ocorrencias.length === 0) return 0;
  const soma = ocorrencias.reduce(
    (acc, o) => acc + parseNumero(o.alturaGrama),
    0
  );
  return Math.round((soma / ocorrencias.length) * 10) / 10;
}

/**
 * Índice de conformidade: percentual de trechos com altura dentro do
 * limite regulatório (LIMITE_REGULATORIO_CM), sobre o total monitorado.
 */
export function indiceConformidade(ocorrencias: Ocorrencia[]): number {
  if (ocorrencias.length === 0) return 100;
  const dentroDoLimite = ocorrencias.filter(
    (o) => parseNumero(o.alturaGrama) <= LIMITE_REGULATORIO_CM
  ).length;
  return Math.round((dentroDoLimite / ocorrencias.length) * 100);
}

/** Trechos ordenados da maior para a menor altura — para o ranking do dashboard. */
export function ordenarPorAltura(ocorrencias: Ocorrencia[]): Ocorrencia[] {
  return [...ocorrencias].sort(
    (a, b) => parseNumero(b.alturaGrama) - parseNumero(a.alturaGrama)
  );
}

/** Trechos críticos (risco alto), ordenados por altura — "Prioridade Máxima". */
export function trechosPrioritarios(
  ocorrencias: Ocorrencia[],
  limite = 5
): Ocorrencia[] {
  return ordenarPorAltura(ocorrencias.filter((o) => o.risco === "alto")).slice(
    0,
    limite
  );
}

/** Conta quantas ocorrências foram registradas no mês corrente (mm/aaaa de o.data). */
export function vistoriasNoMes(
  ocorrencias: Ocorrencia[],
  hoje: Date = new Date()
): number {
  const mesAtual = String(hoje.getMonth() + 1).padStart(2, "0");
  const anoAtual = String(hoje.getFullYear());
  return ocorrencias.filter((o) => {
    const partes = o.data.split("/"); // dd/mm/aaaa
    return partes.length === 3 && partes[1] === mesAtual && partes[2] === anoAtual;
  }).length;
}

// ─────────────────────────────────────────────────────────────
// Histórico de intervenções (roçadas executadas)
// ─────────────────────────────────────────────────────────────

/** Intervenções executadas no mês corrente (pela data do corte). */
export function intervencoesNoMes(
  intervencoes: Intervencao[],
  hoje: Date = new Date()
): number {
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const ano = String(hoje.getFullYear());
  return intervencoes.filter((i) => {
    const p = i.dataCorte.split("/");
    return p.length === 3 && p[1] === mes && p[2] === ano;
  }).length;
}

/**
 * Tempo médio de atendimento: dias entre a detecção da ocorrência e o corte.
 * É o indicador central do problema da Motiva (rapidez de resposta).
 * Retorna null quando não há dados válidos.
 */
export function tempoMedioAtendimentoDias(
  intervencoes: Intervencao[]
): number | null {
  const dias = intervencoes
    .map((i) => diasEntre(i.dataDeteccao, i.dataCorte))
    .filter((d): d is number => d !== null && d >= 0);
  if (dias.length === 0) return null;
  const media = dias.reduce((a, b) => a + b, 0) / dias.length;
  return Math.round(media * 10) / 10;
}

/** Mantém só as intervenções dos últimos `dias` dias (null = sem filtro). */
export function filtrarPorPeriodo(
  intervencoes: Intervencao[],
  dias: number | null,
  hoje: Date = new Date()
): Intervencao[] {
  if (dias === null) return intervencoes;
  return intervencoes.filter((i) => {
    const d = diasDesde(i.dataCorte, hoje);
    return d !== null && d <= dias;
  });
}

/** Histórico de um trecho específico, do mais recente para o mais antigo. */
export function historicoDoLocal(
  intervencoes: Intervencao[],
  local: string
): Intervencao[] {
  return intervencoes
    .filter((i) => i.local === local)
    .sort((a, b) => b.timestamp - a.timestamp);
}

/** Trechos que já receberam 2+ roçadas — candidatos a manejo diferenciado. */
export function trechosReincidentes(
  intervencoes: Intervencao[]
): { local: string; total: number }[] {
  const mapa = new Map<string, number>();
  intervencoes.forEach((i) => mapa.set(i.local, (mapa.get(i.local) ?? 0) + 1));
  return [...mapa.entries()]
    .filter(([, total]) => total >= 2)
    .map(([local, total]) => ({ local, total }))
    .sort((a, b) => b.total - a.total);
}

/** Dias desde a última roçada de um trecho (null se nunca foi cortado). */
export function diasDesdeUltimoCorte(
  intervencoes: Intervencao[],
  local: string,
  hoje: Date = new Date()
): number | null {
  const ultimo = historicoDoLocal(intervencoes, local)[0];
  return ultimo ? diasDesde(ultimo.dataCorte, hoje) : null;
}

export { parseDataBR };

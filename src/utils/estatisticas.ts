import { Ocorrencia } from "../interfaces/ocorrencia";
import { NivelRisco } from "../types/nivelRisco";

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
export function vistoriasNoMes(ocorrencias: Ocorrencia[]): number {
  const hoje = new Date();
  const mesAtual = String(hoje.getMonth() + 1).padStart(2, "0");
  const anoAtual = String(hoje.getFullYear());
  return ocorrencias.filter((o) => {
    const partes = o.data.split("/"); // dd/mm/aaaa
    return partes.length === 3 && partes[1] === mesAtual && partes[2] === anoAtual;
  }).length;
}

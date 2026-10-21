import { Ocorrencia } from "../interfaces/ocorrencia";
import { Intervencao } from "../interfaces/intervencao";
import { NivelRisco } from "../types/nivelRisco";
import {
  descricaoSugerida,
  nomeDoTrecho,
  previsaoCorte,
} from "../utils/formatadores";
import { diasAtras } from "../utils/datas";

/**
 * Dados de demonstração. Todas as datas são relativas a "hoje" — assim o
 * Dashboard ("vistorias no mês", "tempo de atendimento") nunca fica zerado
 * só porque o mock envelheceu.
 *
 */

export type CenarioDados = "completo" | "critico" | "vazio";

export const CENARIOS: {
  chave: CenarioDados;
  titulo: string;
  descricao: string;
}[] = [
  {
    chave: "completo",
    titulo: "Dados completos",
    descricao: "18 trechos e 14 intervenções, todos os níveis de risco",
  },
  {
    chave: "critico",
    titulo: "Muitos críticos",
    descricao: "Maioria em risco alto — testa a fila de prioridade",
  },
  {
    chave: "vazio",
    titulo: "Lista vazia",
    descricao: "Sem ocorrências nem histórico — testa os estados vazios",
  },
];

type Semente = [
  km: number,
  dir: "Norte" | "Sul",
  risco: NivelRisco,
  altura: number,
  diasDeteccao: number,
  distanciaKm: string,
  clima: number,
];

// [KM, (direção — derivada do KM por nomeDoTrecho), risco, altura (cm), detectada há N dias, distância, °C]
const SEMENTES_COMPLETO: Semente[] = [
  [42, "Norte", "alto", 15, 1, "3,2 km", 28],
  [55, "Sul", "alto", 17, 2, "18 km", 29],
  [67, "Norte", "alto", 21, 3, "24 km", 30],
  [12, "Sul", "alto", 16, 0, "9,5 km", 27],
  [28, "Sul", "medio", 9, 1, "7,8 km", 26],
  [33, "Norte", "medio", 12, 2, "11 km", 27],
  [48, "Sul", "medio", 10, 4, "15 km", 28],
  [71, "Norte", "medio", 13, 5, "27 km", 29],
  [19, "Norte", "medio", 8, 3, "6,1 km", 25],
  [5, "Sul", "medio", 11, 6, "2,4 km", 26],
  [10, "Norte", "baixo", 4, 1, "12 km", 27],
  [22, "Sul", "baixo", 5, 7, "8,3 km", 26],
  [37, "Norte", "baixo", 3, 2, "13 km", 28],
  [60, "Sul", "baixo", 6, 8, "21 km", 29],
  [64, "Norte", "baixo", 4, 9, "23 km", 28],
  [75, "Sul", "baixo", 7, 3, "30 km", 30],
  [81, "Norte", "baixo", 5, 10, "34 km", 31],
  [90, "Sul", "baixo", 2, 4, "41 km", 31],
];

const SEMENTES_CRITICO: Semente[] = [
  [42, "Norte", "alto", 19, 6, "3,2 km", 30],
  [55, "Sul", "alto", 22, 7, "18 km", 31],
  [67, "Norte", "alto", 24, 9, "24 km", 31],
  [12, "Sul", "alto", 17, 3, "9,5 km", 29],
  [33, "Norte", "alto", 18, 4, "11 km", 29],
  [48, "Sul", "alto", 20, 8, "15 km", 30],
  [71, "Norte", "alto", 16, 2, "27 km", 30],
  [28, "Sul", "alto", 23, 10, "7,8 km", 31],
  [19, "Norte", "alto", 15, 1, "6,1 km", 28],
  [5, "Sul", "medio", 12, 5, "2,4 km", 27],
  [22, "Sul", "medio", 10, 3, "8,3 km", 27],
  [10, "Norte", "baixo", 5, 1, "12 km", 27],
];

const RESPONSAVEIS = [
  "Auro Vanetti",
  "Renan Otero",
  "Enzo Nishida",
  "Bruno Santanna",
];

// [KM, dir, risco antes, altura antes, detectada há N dias, cortada há M dias, observação?]
type SementeCorte = [
  number,
  "Norte" | "Sul",
  NivelRisco,
  number,
  number,
  number,
  string?,
];
const SEMENTES_CORTES: SementeCorte[] = [
  [
    42,
    "Norte",
    "alto",
    18,
    3,
    0,
    "Roçada mecanizada. Sinalização vertical liberada.",
  ],
  [
    55,
    "Sul",
    "alto",
    20,
    6,
    2,
    "Acúmulo de material orgânico removido do acostamento.",
  ],
  [67, "Norte", "medio", 11, 9, 5],
  [
    28,
    "Sul",
    "alto",
    16,
    13,
    9,
    "Corte realizado após chuva forte; solo úmido.",
  ],
  [10, "Norte", "medio", 9, 17, 14],
  [33, "Norte", "alto", 19, 22, 18, "Placa de km estava parcialmente oculta."],
  [48, "Sul", "medio", 10, 27, 23],
  [
    71,
    "Norte",
    "alto",
    22,
    33,
    29,
    "Equipe precisou de apoio de sinalização móvel.",
  ],
  [19, "Norte", "baixo", 6, 38, 34],
  [12, "Sul", "alto", 17, 44, 40, "Segunda intervenção no trecho em 2 meses."],
  [5, "Sul", "medio", 12, 49, 45],
  [60, "Sul", "medio", 10, 55, 50],
  [42, "Norte", "alto", 17, 62, 58, "Primeira roçada do ciclo."],
  [22, "Sul", "baixo", 7, 66, 61],
];

function criarOcorrencia(s: Semente, i: number, hoje: Date): Ocorrencia {
  const [km, , risco, altura, dias, distancia, clima] = s;
  const local = nomeDoTrecho(km);
  return {
    id: `mock-oc-${i + 1}`,
    local,
    risco,
    data: diasAtras(dias, hoje),
    alturaGrama: `${altura}cm`,
    distancia,
    previsaoCorte: previsaoCorte(risco),
    clima: `${clima}°C`,
    descricao: descricaoSugerida(risco, local),
    origem: "mock",
  };
}

function criarIntervencao(s: SementeCorte, i: number, hoje: Date): Intervencao {
  const [km, , risco, altura, detectadaHa, cortadaHa, obs] = s;
  return {
    id: `mock-iv-${i + 1}`,
    ocorrenciaId: `mock-hist-${i + 1}`,
    local: nomeDoTrecho(km),
    riscoAntes: risco,
    alturaAntes: `${altura}cm`,
    dataDeteccao: diasAtras(detectadaHa, hoje),
    dataCorte: diasAtras(cortadaHa, hoje),
    timestamp: new Date(hoje.getTime() - cortadaHa * 86_400_000).getTime(),
    responsavel: RESPONSAVEIS[i % RESPONSAVEIS.length],
    observacao: obs,
    origem: "mock",
  };
}

export function montarCenario(
  cenario: CenarioDados,
  hoje: Date = new Date(),
): { ocorrencias: Ocorrencia[]; intervencoes: Intervencao[] } {
  if (cenario === "vazio") return { ocorrencias: [], intervencoes: [] };

  const sementes = cenario === "critico" ? SEMENTES_CRITICO : SEMENTES_COMPLETO;
  const cortes =
    cenario === "critico" ? SEMENTES_CORTES.slice(0, 4) : SEMENTES_CORTES;

  return {
    ocorrencias: sementes.map((s, i) => criarOcorrencia(s, i, hoje)),
    intervencoes: cortes
      .map((s, i) => criarIntervencao(s, i, hoje))
      .sort((a, b) => b.timestamp - a.timestamp),
  };
}

// Compatibilidade com o código da Sprint 3
export const ocorrenciasIniciais: Ocorrencia[] =
  montarCenario("completo").ocorrencias;
export const intervencoesIniciais: Intervencao[] =
  montarCenario("completo").intervencoes;

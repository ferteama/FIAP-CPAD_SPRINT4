import { Ocorrencia } from "../src/interfaces/ocorrencia";
import { Intervencao } from "../src/interfaces/intervencao";
import {
  alturaMediaCm,
  contarPorRisco,
  diasDesdeUltimoCorte,
  filtrarPorPeriodo,
  historicoDoLocal,
  indiceConformidade,
  intervencoesNoMes,
  ordenarPorAltura,
  parseKm,
  parseNumero,
  tempoMedioAtendimentoDias,
  trechosPrioritarios,
  trechosReincidentes,
  vistoriasNoMes,
} from "../src/utils/estatisticas";

const HOJE = new Date(2026, 9, 19, 12);

function oc(id: string, risco: Ocorrencia["risco"], altura: number, data = "10/10/2026"): Ocorrencia {
  return { id, descricao: "", local: `KM ${id} — Norte`, risco, data, alturaGrama: `${altura}cm`, distancia: "1 km", previsaoCorte: "1 dia", clima: "25°C" };
}
function iv(id: string, local: string, detec: string, corte: string, ts: number): Intervencao {
  return { id, ocorrenciaId: `o-${id}`, local, riscoAntes: "alto", alturaAntes: "15cm", dataDeteccao: detec, dataCorte: corte, timestamp: ts, responsavel: "Ana" };
}

describe("estatísticas de ocorrências", () => {
  const lista = [oc("1", "alto", 20), oc("2", "medio", 10), oc("3", "baixo", 4), oc("4", "alto", 15)];

  test("parse de números e KM", () => {
    expect(parseNumero("16cm")).toBe(16);
    expect(parseNumero("3,2 km")).toBe(3.2);
    expect(parseNumero("sem número")).toBe(0);
    expect(parseKm("KM 42 — Norte")).toBe(42);
  });

  test("contagem por risco", () => {
    expect(contarPorRisco(lista)).toEqual({ alto: 2, medio: 1, baixo: 1 });
    expect(contarPorRisco([])).toEqual({ alto: 0, medio: 0, baixo: 0 });
  });

  test("altura média e lista vazia sem NaN", () => {
    expect(alturaMediaCm(lista)).toBe(12.3);
    expect(alturaMediaCm([])).toBe(0);
  });

  test("conformidade considera ≤ 10cm dentro do padrão", () => {
    expect(indiceConformidade(lista)).toBe(50); // 10cm e 4cm
    expect(indiceConformidade([])).toBe(100);
  });

  test("ranking e prioridade ordenam pela altura", () => {
    expect(ordenarPorAltura(lista).map((o) => o.id)).toEqual(["1", "4", "2", "3"]);
    expect(trechosPrioritarios(lista).map((o) => o.id)).toEqual(["1", "4"]);
    expect(trechosPrioritarios(lista, 1)).toHaveLength(1);
  });

  test("vistorias no mês respeitam mês e ano", () => {
    const l = [oc("1", "alto", 1, "05/10/2026"), oc("2", "alto", 1, "05/10/2025"), oc("3", "alto", 1, "30/09/2026")];
    expect(vistoriasNoMes(l, HOJE)).toBe(1);
  });
});

describe("estatísticas do histórico de intervenções", () => {
  const hist = [
    iv("a", "KM 42 — Norte", "01/10/2026", "03/10/2026", 3),
    iv("b", "KM 42 — Norte", "10/10/2026", "16/10/2026", 4),
    iv("c", "KM 7 — Sul", "20/09/2026", "25/09/2026", 2),
  ];

  test("intervenções no mês", () => {
    expect(intervencoesNoMes(hist, HOJE)).toBe(2);
    expect(intervencoesNoMes([], HOJE)).toBe(0);
  });

  test("tempo médio de atendimento (2, 6 e 5 dias → 4,3)", () => {
    expect(tempoMedioAtendimentoDias(hist)).toBe(4.3);
    expect(tempoMedioAtendimentoDias([])).toBeNull();
  });

  test("tempo médio ignora datas inválidas ou invertidas", () => {
    const ruim = [iv("x", "KM 1 — Sul", "xx", "03/10/2026", 1), iv("y", "KM 1 — Sul", "10/10/2026", "05/10/2026", 2)];
    expect(tempoMedioAtendimentoDias(ruim)).toBeNull();
  });

  test("filtro por período", () => {
    expect(filtrarPorPeriodo(hist, 7, HOJE).map((i) => i.id)).toEqual(["b"]);
    expect(filtrarPorPeriodo(hist, 30, HOJE)).toHaveLength(3);
    expect(filtrarPorPeriodo(hist, null, HOJE)).toHaveLength(3);
  });

  test("histórico do trecho vem do mais recente para o mais antigo", () => {
    expect(historicoDoLocal(hist, "KM 42 — Norte").map((i) => i.id)).toEqual(["b", "a"]);
    expect(historicoDoLocal(hist, "KM 99 — Sul")).toEqual([]);
  });

  test("reincidência e dias desde o último corte", () => {
    expect(trechosReincidentes(hist)).toEqual([{ local: "KM 42 — Norte", total: 2 }]);
    expect(diasDesdeUltimoCorte(hist, "KM 42 — Norte", HOJE)).toBe(3);
    expect(diasDesdeUltimoCorte(hist, "KM 99 — Sul", HOJE)).toBeNull();
  });
});

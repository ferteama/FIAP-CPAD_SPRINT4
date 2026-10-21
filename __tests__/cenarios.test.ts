import { CENARIOS, montarCenario } from "../src/data/ocorrencias";
import { diasEntre, parseDataBR } from "../src/utils/datas";
import { alturaMediaCm, contarPorRisco, tempoMedioAtendimentoDias, trechosReincidentes, vistoriasNoMes, intervencoesNoMes } from "../src/utils/estatisticas";

const HOJE = new Date(2026, 9, 19, 12);

describe("dados de demonstração", () => {
  const completo = montarCenario("completo", HOJE);

  test("há massa de dados suficiente (feedback da Sprint 3: só havia 4 ocorrências)", () => {
    expect(completo.ocorrencias.length).toBeGreaterThanOrEqual(15);
    expect(completo.intervencoes.length).toBeGreaterThanOrEqual(10);
  });

  test("cobre os três níveis de risco", () => {
    const c = contarPorRisco(completo.ocorrencias);
    expect(c.alto).toBeGreaterThan(0);
    expect(c.medio).toBeGreaterThan(0);
    expect(c.baixo).toBeGreaterThan(0);
  });

  test("IDs únicos e todos marcados como mock (nunca vão ao Firestore)", () => {
    const ids = [...completo.ocorrencias.map((o) => o.id), ...completo.intervencoes.map((i) => i.id)];
    expect(new Set(ids).size).toBe(ids.length);
    expect(completo.ocorrencias.every((o) => o.origem === "mock")).toBe(true);
    expect(completo.intervencoes.every((i) => i.origem === "mock")).toBe(true);
  });

  test("datas válidas e coerentes: corte nunca antes da detecção, nada no futuro", () => {
    completo.intervencoes.forEach((i) => {
      expect(diasEntre(i.dataDeteccao, i.dataCorte)).toBeGreaterThanOrEqual(0);
      expect(parseDataBR(i.dataCorte)!.getTime()).toBeLessThanOrEqual(HOJE.getTime());
    });
    completo.ocorrencias.forEach((o) => expect(parseDataBR(o.data)).not.toBeNull());
  });

  test("risco é coerente com a altura (alto > 10cm, baixo ≤ 7cm)", () => {
    completo.ocorrencias.forEach((o) => {
      const h = parseFloat(o.alturaGrama);
      if (o.risco === "alto") expect(h).toBeGreaterThan(10);
      if (o.risco === "baixo") expect(h).toBeLessThanOrEqual(7);
    });
  });

  test("o dashboard não fica zerado (datas relativas a hoje)", () => {
    expect(vistoriasNoMes(completo.ocorrencias, HOJE)).toBeGreaterThan(0);
    expect(intervencoesNoMes(completo.intervencoes, HOJE)).toBeGreaterThan(0);
    expect(tempoMedioAtendimentoDias(completo.intervencoes)).not.toBeNull();
    expect(trechosReincidentes(completo.intervencoes).length).toBeGreaterThan(0);
    expect(alturaMediaCm(completo.ocorrencias)).toBeGreaterThan(0);
  });

  test("cenário vazio devolve listas vazias (estado vazio)", () => {
    expect(montarCenario("vazio", HOJE)).toEqual({ ocorrencias: [], intervencoes: [] });
  });

  test("cenário crítico tem maioria em risco alto", () => {
    const c = montarCenario("critico", HOJE);
    const risco = contarPorRisco(c.ocorrencias);
    expect(risco.alto).toBeGreaterThan(c.ocorrencias.length / 2);
  });

  test("todos os cenários listados no Perfil existem", () => {
    CENARIOS.forEach((c) => expect(() => montarCenario(c.chave, HOJE)).not.toThrow());
  });
});

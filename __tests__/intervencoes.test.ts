import { Ocorrencia } from "../src/interfaces/ocorrencia";
import { criarIntervencao } from "../src/utils/intervencoes";

const oc: Ocorrencia = {
  id: "oc-1", descricao: "d", local: "KM 42 — Norte", risco: "alto", data: "10/10/2026",
  alturaGrama: "17cm", distancia: "3 km", previsaoCorte: "1 dia", clima: "28°C",
};

describe("criarIntervencao (registrar corte)", () => {
  const agora = new Date(2026, 9, 19, 14, 30);

  test("preserva o estado do trecho antes do corte (histórico)", () => {
    const i = criarIntervencao(oc, "Maria", "Equipe B", agora);
    expect(i).toMatchObject({
      ocorrenciaId: "oc-1", local: "KM 42 — Norte", riscoAntes: "alto", alturaAntes: "17cm",
      dataDeteccao: "10/10/2026", dataCorte: "19/10/2026", responsavel: "Maria", observacao: "Equipe B", origem: "app",
    });
    expect(i.timestamp).toBe(agora.getTime());
  });

  test("observação vazia ou só espaços vira undefined", () => {
    expect(criarIntervencao(oc, "Maria", "   ", agora).observacao).toBeUndefined();
    expect(criarIntervencao(oc, "Maria", undefined, agora).observacao).toBeUndefined();
  });

  test("responsável em branco cai em 'Operador' e IDs não se repetem", () => {
    const a = criarIntervencao(oc, "  ", undefined, agora);
    const b = criarIntervencao(oc, "  ", undefined, agora);
    expect(a.responsavel).toBe("Operador");
    expect(a.id).not.toBe(b.id);
  });
});

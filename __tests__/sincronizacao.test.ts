import { Ocorrencia } from "../src/interfaces/ocorrencia";
import { Intervencao } from "../src/interfaces/intervencao";
import { mesclarIntervencoes, mesclarOcorrencias } from "../src/utils/sincronizacao";

function oc(id: string, extra: Partial<Ocorrencia> = {}): Ocorrencia {
  return { id, descricao: "", local: "KM 1 — Sul", risco: "baixo", data: "10/10/2026", alturaGrama: "4cm", distancia: "1 km", previsaoCorte: "10 dias", clima: "25°C", origem: "manual", ...extra };
}
function iv(id: string, ocorrenciaId: string, extra: Partial<Intervencao> = {}): Intervencao {
  return { id, ocorrenciaId, local: "KM 1 — Sul", riscoAntes: "baixo", alturaAntes: "4cm", dataDeteccao: "10/10/2026", dataCorte: "12/10/2026", timestamp: 1, responsavel: "Ana", origem: "app", ...extra };
}

describe("mesclarOcorrencias", () => {
  test("une locais e remotas e identifica o que falta enviar", () => {
    const { resultado, paraEnviar } = mesclarOcorrencias([oc("a"), oc("b")], [oc("b"), oc("c")], []);
    expect(resultado.map((o) => o.id).sort()).toEqual(["a", "b", "c"]);
    expect(paraEnviar.map((o) => o.id)).toEqual(["a"]);
  });

  test("dados de demonstração (mock) nunca são enviados", () => {
    const { paraEnviar } = mesclarOcorrencias([oc("m", { origem: "mock" })], [], []);
    expect(paraEnviar).toEqual([]);
  });

  test("ocorrência já roçada (consta no histórico) não volta para a fila ativa", () => {
    const { resultado, paraEnviar } = mesclarOcorrencias([oc("a")], [oc("a"), oc("b")], [iv("i1", "a")]);
    expect(resultado.map((o) => o.id)).toEqual(["b"]);
    expect(paraEnviar).toEqual([]);
  });

  test("preserva a foto local ao receber a versão remota", () => {
    const { resultado } = mesclarOcorrencias([oc("a", { fotoUri: "file:///x.jpg" })], [oc("a", { risco: "alto" })], []);
    expect(resultado[0].fotoUri).toBe("file:///x.jpg");
    expect(resultado[0].risco).toBe("alto"); // remoto prevalece nos demais campos
  });

  test("ordena as mais recentes primeiro", () => {
    const { resultado } = mesclarOcorrencias([oc("velha", { data: "01/10/2026" })], [oc("nova", { data: "15/10/2026" })], []);
    expect(resultado.map((o) => o.id)).toEqual(["nova", "velha"]);
  });
});

describe("mesclarIntervencoes", () => {
  test("união por id, mais recentes primeiro, e envio só do que é novo e não-mock", () => {
    const locais = [iv("1", "o1", { timestamp: 5 }), iv("2", "o2", { timestamp: 9, origem: "mock" })];
    const remotas = [iv("3", "o3", { timestamp: 7 })];
    const { resultado, paraEnviar } = mesclarIntervencoes(locais, remotas);
    expect(resultado.map((i) => i.id)).toEqual(["2", "3", "1"]);
    expect(paraEnviar.map((i) => i.id)).toEqual(["1"]);
  });
});

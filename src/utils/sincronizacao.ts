import { Ocorrencia } from "../interfaces/ocorrencia";
import { Intervencao } from "../interfaces/intervencao";
import { parseDataBR } from "./datas";

/**
 * sincronizacao.ts — regras puras de mesclagem entre os dados locais
 * (AsyncStorage) e os remotos (Firestore). Testadas em __tests__/sincronizacao.test.ts.
 *
 * Decisões:
 *  - Intervenções são imutáveis e nunca apagadas → união por id.
 *  - O histórico serve de "lápide": uma ocorrência cuja id aparece em alguma
 *    intervenção já foi roçada e não volta para a lista ativa, mesmo que
 *    outro aparelho ainda a tenha em cache.
 *  - Dados de demonstração (origem "mock") nunca são enviados ao Firestore.
 */

export function mesclarIntervencoes(
  locais: Intervencao[],
  remotas: Intervencao[]
): { resultado: Intervencao[]; paraEnviar: Intervencao[] } {
  const mapa = new Map<string, Intervencao>();
  locais.forEach((i) => mapa.set(i.id, i));
  remotas.forEach((i) => mapa.set(i.id, i)); // remoto prevalece em conflito

  const idsRemotos = new Set(remotas.map((i) => i.id));
  const paraEnviar = locais.filter((i) => i.origem !== "mock" && !idsRemotos.has(i.id));

  const resultado = [...mapa.values()].sort((a, b) => b.timestamp - a.timestamp);
  return { resultado, paraEnviar };
}

export function mesclarOcorrencias(
  locais: Ocorrencia[],
  remotas: Ocorrencia[],
  intervencoes: Intervencao[]
): { resultado: Ocorrencia[]; paraEnviar: Ocorrencia[] } {
  const resolvidas = new Set(intervencoes.map((i) => i.ocorrenciaId));
  const idsRemotos = new Set(remotas.map((o) => o.id));

  const mapa = new Map<string, Ocorrencia>();
  locais.filter((o) => !resolvidas.has(o.id)).forEach((o) => mapa.set(o.id, o));
  remotas
    .filter((o) => !resolvidas.has(o.id))
    .forEach((o) => {
      const local = mapa.get(o.id);
      // A foto só existe no aparelho de origem — preserva a local
      mapa.set(o.id, { ...o, fotoUri: local?.fotoUri });
    });

  const paraEnviar = locais.filter(
    (o) => o.origem !== "mock" && !resolvidas.has(o.id) && !idsRemotos.has(o.id)
  );

  // Mais recentes primeiro (sort é estável: empates mantêm a ordem local)
  const resultado = [...mapa.values()].sort(
    (a, b) =>
      (parseDataBR(b.data)?.getTime() ?? 0) - (parseDataBR(a.data)?.getTime() ?? 0)
  );

  return { resultado, paraEnviar };
}

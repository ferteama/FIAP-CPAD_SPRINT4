import { NivelRisco } from "../types/nivelRisco";

/** Rótulos de risco em texto puro (sem depender de cores/React) — usados em exportações e testes. */
export const RISCO_ROTULO: Record<NivelRisco, string> = {
  alto: "Alto",
  medio: "Médio",
  baixo: "Baixo",
};

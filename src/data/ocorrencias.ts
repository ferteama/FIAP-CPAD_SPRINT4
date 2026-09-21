import { Ocorrencia } from "../interfaces/ocorrencia";

export const ocorrenciasIniciais: Ocorrencia[] = [
  {
    id: 1,
    descricao:
      "Grama acima do limite de segurança (10cm). Risco de obstrução de sinalização e fauna na pista.",
    local: "KM 42 — Norte",
    risco: "alto",
    data: "11/06/2025",
    alturaGrama: "15cm",
    distancia: "3,2 km",
    previsaoCorte: "2 dias",
    clima: "28°C",
  },
  {
    id: 2,
    descricao:
      "Vegetação em crescimento moderado. Recomenda-se agendamento de corte preventivo.",
    local: "KM 28 — Sul",
    risco: "medio",
    data: "11/06/2025",
    alturaGrama: "9cm",
    distancia: "7,8 km",
    previsaoCorte: "5 dias",
    clima: "26°C",
  },
  {
    id: 3,
    descricao:
      "Vegetação dentro dos parâmetros normais. Monitoramento de rotina.",
    local: "KM 10 — Norte",
    risco: "baixo",
    data: "10/06/2025",
    alturaGrama: "4cm",
    distancia: "12 km",
    previsaoCorte: "14 dias",
    clima: "27°C",
  },
  {
    id: 4,
    descricao:
      "Altura crítica detectada pelo drone. Possível ocultação de placa de sinalização.",
    local: "KM 55 — Sul",
    risco: "alto",
    data: "10/06/2025",
    alturaGrama: "17cm",
    distancia: "18 km",
    previsaoCorte: "1 dia",
    clima: "29°C",
  },
];

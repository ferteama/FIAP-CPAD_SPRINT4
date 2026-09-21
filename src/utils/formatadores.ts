import { NivelRisco } from "../types/nivelRisco";

export function dataHoje(): string {
  const hoje = new Date();
  const dd  = String(hoje.getDate()).padStart(2, "0");
  const mm  = String(hoje.getMonth() + 1).padStart(2, "0");
  const aaaa = hoje.getFullYear();
  return `${dd}/${mm}/${aaaa}`;
}

export function proximoId(ids: number[]): number {
  if (ids.length === 0) return 1;
  return Math.max(...ids) + 1;
}

export function alturaEstimada(risco: NivelRisco): string {
  switch (risco) {
    case "alto":  return "16cm";
    case "medio": return "9cm";
    case "baixo": return "4cm";
  }
}

export function previsaoCorte(risco: NivelRisco): string {
  switch (risco) {
    case "alto":  return "1 dia";
    case "medio": return "5 dias";
    case "baixo": return "14 dias";
  }
}

export function descricaoSugerida(risco: NivelRisco, local: string): string {
  switch (risco) {
    case "alto":
      return `Grama acima do limite de segurança (10cm) em ${local}. Risco de obstrução de sinalização e fauna na pista.`;
    case "medio":
      return `Vegetação em crescimento moderado em ${local}. Recomenda-se agendamento de corte preventivo.`;
    case "baixo":
      return `Vegetação dentro dos parâmetros normais em ${local}. Monitoramento de rotina.`;
  }
}

export function distanciaSimulada(): string {
  const valores = ["2,1 km", "5,4 km", "8,9 km", "14 km", "21 km"];
  return valores[Math.floor(Math.random() * valores.length)];
}

export function climaSimulado(): string {
  const temperaturas = [25, 26, 27, 28, 29, 30, 31];
  const valor = temperaturas[Math.floor(Math.random() * temperaturas.length)];
  return `${valor}°C`;
}

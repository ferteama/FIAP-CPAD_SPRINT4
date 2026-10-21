import { NivelRisco } from "../types/nivelRisco";

export function dataHoje(): string {
  const hoje = new Date();
  const dd  = String(hoje.getDate()).padStart(2, "0");
  const mm  = String(hoje.getMonth() + 1).padStart(2, "0");
  const aaaa = hoje.getFullYear();
  return `${dd}/${mm}/${aaaa}`;
}

/**
 * ID único e seguro para uso offline/multi-aparelho (Firestore).
 * Não depende de "maior id + 1", que colidiria entre dois operadores.
 */
export function gerarId(prefixo = "oc"): string {
  const aleatorio = Math.random().toString(36).slice(2, 8);
  return `${prefixo}-${Date.now().toString(36)}-${aleatorio}`;
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

/**
 * Sentido da pista a partir do número do KM (regra do protótipo: par = Norte,
 * ímpar = Sul). Centralizada aqui para o cadastro e os dados de demonstração
 * gerarem sempre o mesmo nome de trecho — é o que liga a ocorrência ao seu histórico.
 */
export function direcaoDoKm(km: number): "Norte" | "Sul" {
  return km % 2 === 0 ? "Norte" : "Sul";
}

export function nomeDoTrecho(km: number): string {
  return `KM ${km} — ${direcaoDoKm(km)}`;
}

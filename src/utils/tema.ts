import { NivelRisco } from "../types/nivelRisco";

export const CORES = {
  // Fundos
  background:      "#F6FAF7",   
  card:            "#FFFFFF",   

  // Texto
  foreground:        "#1C2536",  
  mutedForeground:   "#7C8B96",   

  // Marca — Motiva
  primary:         "#2F6B4C",   
  primaryGlow:     "#4E9B6E",   
  secondary:       "#1B3A57",   
  secondaryForeground: "#FFFFFF",

  // Superfícies
  muted:           "#EEF2F0",   
  accent:          "#DCEFE2",   
  accentForeground: "#1B3A57",

  // Bordas
  border:          "#E3E8E5",

  // Status / Risco
  destructive:            "#E5484D", // vermelho — risco alto
  destructiveForeground:  "#FFFFFF",
  warning:                "#F3B43D", // amarelo — risco médio
  warningForeground:      "#4A350A",
  success:                "#3FA35E", // verde — risco baixo
  successForeground:      "#FFFFFF",
} as const;

export const GRADIENTE_HEADER = [CORES.secondary, CORES.primary] as const;
export const GRADIENTE_PRIMARIO = [CORES.primary, CORES.primaryGlow] as const;

// ── Helpers de cor / texto por nível de risco ──
// NivelRisco vive em src/types/nivelRisco.ts (fonte única — sem duplicar aqui)

export const RISCO_ESTILO: Record<
  NivelRisco,
  { label: string; bg: string; texto: string }
> = {
  alto:  { label: "RISCO ALTO",  bg: CORES.destructive, texto: CORES.destructiveForeground },
  medio: { label: "RISCO MÉDIO", bg: CORES.warning,     texto: CORES.warningForeground },
  baixo: { label: "RISCO BAIXO", bg: CORES.success,     texto: CORES.successForeground },
};

export const COR_RISCO: Record<NivelRisco, string> = {
  baixo: CORES.success,
  medio: CORES.warning,
  alto:  CORES.destructive,
};

export const LABEL_RISCO: Record<NivelRisco, string> = {
  baixo: "Baixo",
  medio: "Médio",
  alto:  "Alto",
};

export const SOMBRA_CARD = {
  shadowColor: "#1C2536",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
} as const;

export const SOMBRA_FAB = {
  shadowColor: CORES.primary,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.35,
  shadowRadius: 14,
  elevation: 8,
} as const;

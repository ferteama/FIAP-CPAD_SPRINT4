/**
 * datas.ts — funções puras para datas no formato brasileiro (dd/mm/aaaa).
 * Todas recebem a data de referência como parâmetro para serem testáveis.
 */

export function formatarDataBR(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** "25/10/2026" → Date local (meio-dia, evita problemas de fuso/horário de verão). */
export function parseDataBR(texto: string): Date | null {
  const m = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, aaaa] = m;
  const d = new Date(Number(aaaa), Number(mm) - 1, Number(dd), 12, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function diasAtras(n: number, hoje: Date = new Date()): string {
  const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 12);
  d.setDate(d.getDate() - n);
  return formatarDataBR(d);
}

/** Diferença em dias inteiros entre duas datas dd/mm/aaaa (b - a). null se inválida. */
export function diasEntre(a: string, b: string): number | null {
  const da = parseDataBR(a);
  const db = parseDataBR(b);
  if (!da || !db) return null;
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

/** Quantos dias se passaram desde `data` até `hoje` (>= 0). */
export function diasDesde(data: string, hoje: Date = new Date()): number | null {
  const d = diasEntre(data, formatarDataBR(hoje));
  return d === null ? null : Math.max(0, d);
}

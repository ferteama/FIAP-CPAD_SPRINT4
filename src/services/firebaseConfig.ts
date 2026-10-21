/** Validação pura da configuração do Firebase (sem importar o SDK — testável). */
export function configuracaoValida(c: { apiKey: string; projectId: string; appId: string }): boolean {
  const ok = (v: string) => v.trim().length > 0 && !v.startsWith("sua-") && !v.startsWith("SUA_");
  return ok(c.apiKey) && ok(c.projectId) && ok(c.appId);
}

# Documento de Testes Manuais — Sprint 3

**Projeto:** Drone Vision Watch — Motiva
**Equipe:** Equipe 11
**Disciplina:** Cross-Platform Application Development

> Preenchido estaticamente a partir do comportamento esperado do código
> (`tsc --strict` sem erros, build web via `expo export` ok). Rodar cada
> fluxo em dispositivo/emulador real e ajustar "Resultado obtido" e
> "Status" antes de gravar o vídeo.

| # | Cenário testado | Resultado esperado | Resultado obtido | Status |
|---|---|---|---|---|
| 1 | Cadastrar vistoria anexando uma foto, sem escolher risco manual | App envia a foto pra API, exibe "Analisando foto...", cria a ocorrência com o risco/altura vindos da análise e volta ao Dashboard | | ✅ Passou ☐ Falhou |
| 2 | Cadastrar vistoria com foto, mas com o backend desligado | App detecta a falha, cai automaticamente no modo simulado (descrição com "[modo offline]") e cria a ocorrência normalmente, sem travar | | ✅ Passou ☐ Falhou |
| 3 | Cadastrar vistoria sem foto e sem selecionar risco, depois tentar enviar | App não permite o envio da vistoria | | ✅ Passou ☐ Falhou |
| 4 | Dashboard reagindo aos dados (métricas, ranking, prioridade máxima, índice de conformidade) | App demonstra mudanças no ínicio e no relatório | | ✅ Passou ☐ Falhou |
| 5 | Na aba Trechos, ativar o filtro "Urgente" e depois desativar | Lista mostra só ocorrências de risco alto (ou estado vazio se não houver); ao tocar de novo, volta a mostrar todas | | ✅ Passou ☐ Falhou |
| 6 | Abrir o detalhe de uma ocorrência e tocar em "Registrar corte realizado" | Ocorrência some da lista e do Dashboard; ao fechar e reabrir o app, ela continua removida (persistência) | | ✅ Passou ☐ Falhou |
| 7 | Relatório consolidado (resumo geral + tabela por trecho) | App demonstra todos os casos "reais" relatados| | ✅ Passou ☐ Falhou |


## Pontos de melhoria para a Sprint 4

- Testes automatizados para `src/utils/estatisticas.ts`
- Histórico dos cortes já registrados (hoje a ocorrência só é removida)
- Validar o layout do Dashboard em telas pequenas
- Integração com API melhorada

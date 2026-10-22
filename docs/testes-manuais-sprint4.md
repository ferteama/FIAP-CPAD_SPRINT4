# Documento de Testes Manuais — Sprint 4

**Projeto:** Drone Vision Watch — Motiva · **Equipe:** 11 · **Disciplina:** Cross-Platform Application Development

> **Resposta ao feedback da Sprint 3.** O documento anterior trazia "Exatamente como o resultado
> esperado" em todos os casos, sem descrever o que foi observado. Neste, **cada caso tem passos
> reproduzíveis** e a coluna *Resultado obtido* deve receber **o que realmente aconteceu na tela**
> (textos exibidos, valores, tempo de resposta, comportamento inesperado) — mesmo quando passar.
> Se falhar, descreva o defeito, abra uma linha em "Defeitos encontrados" e registre a correção.

## 1. Ambiente do teste (preencher)

| Item | Valor |
|---|---|
| Data / quem testou | |
| Aparelho e versão do Android/iOS | |
| Como o app rodou | ☐ Expo Go  ☐ APK instalado (build `preview`)  ☐ Navegador |
| Backend (`uvicorn`) | ☐ Ligado em ____________  ☐ Desligado |
| Firebase | ☐ Configurado (`.env` preenchido)  ☐ Modo demonstração |
| Commit / versão testada | |

## 2. Verificações automáticas (já executadas)

Não substituem os testes manuais abaixo — cobrem só lógica pura e build.

| Verificação | Comando | Resultado |
|---|---|---|
| Tipagem estrita (TypeScript) | `npm run typecheck` | sem erros |
| Testes unitários do app (7 suítes, 52 testes: datas, estatísticas, histórico de intervenções, mesclagem de sincronização, validação de login, exportação CSV/HTML, consistência dos mocks) | `npm test` | 52 passaram |
| Testes da API (7 testes: cobertura, relação cobertura→altura, efeito do clima, contrato JSON, imagem inválida → 422, campo obrigatório) | `cd backend && pytest -q` | 7 passaram |
| Bundle do app | `npx expo export --platform web` e `--platform android` | ambos geram o bundle |

## 3. Casos de teste manuais

Preencher *Resultado obtido* e marcar o status. Prioridade **A** = obrigatório antes de gravar o vídeo.

### 3.1 Autenticação (Firebase)

| ID | Pri. | Cenário e passos | Resultado esperado | Resultado obtido (descrever o que viu) | Status |
|---|---|---|---|---|---|
| T01 | A | **Criar conta válida.** Login → "Criar conta" → nome completo, cargo, e-mail novo, senha ≥ 6 e confirmação iguais → "Criar conta". | Entra direto no app (Início); saudação com o primeiro nome; Perfil mostra nome, e-mail, cargo e etiqueta FIREBASE. No Console: usuário em Authentication e documento em `users/{uid}`. | | ☐ Passou ☐ Falhou |
| T02 | A | **E-mail já cadastrado.** Repetir T01 com o mesmo e-mail. | Faixa vermelha "Já existe uma conta com esse e-mail." Permanece na tela. | | ☐ Passou ☐ Falhou |
| T03 | A | **Validação local.** Cadastro com nome de 2 letras, e-mail `abc`, senha de 3 caracteres e confirmação diferente. | Mensagem em cada campo; **nenhuma** chamada ao Firebase (sem *spinner*). | | ☐ Passou ☐ Falhou |
| T04 | A | **Senha incorreta.** Entrar com e-mail correto e senha errada. | "E-mail ou senha incorretos." (sem revelar qual dos dois). | | ☐ Passou ☐ Falhou |
| T05 | A | **Sessão persistente.** Entrar, fechar o app por completo (remover dos recentes) e abrir de novo. | Abre direto no Início, sem pedir login. | | ☐ Passou ☐ Falhou |
| T06 | A | **Sair.** Início → avatar → "Sair da conta" → confirmar. | Volta ao login. Reabrir o app continua no login. | | ☐ Passou ☐ Falhou |
| T07 | B | **Recuperar senha.** Login → e-mail → "Esqueci minha senha". | Aviso verde; e-mail de redefinição chega (conferir spam). Sem e-mail digitado: erro no campo. | | ☐ Passou ☐ Falhou |
| T08 | B | **Sem Firebase.** Rodar sem `.env` (ou com os valores de exemplo). | Faixa amarela "Firebase não configurado" e botão "Entrar em modo demonstração"; o app **não** quebra. Perfil mostra etiqueta DEMO. | | ☐ Passou ☐ Falhou |

### 3.2 Fluxos principais

| ID | Pri. | Cenário e passos | Resultado esperado | Resultado obtido (descrever o que viu) | Status |
|---|---|---|---|---|---|
| T09 | A | **Vistoria com foto, API ligada.** Vistoria → KM → anexar foto → Enviar. | Botão "Analisando foto..."; alerta "Enviado!"; novo trecho no topo de Trechos; descrição cita **"modelo XGBoost"**, com altura, cobertura e previsão de corte. | | ☐ Passou ☐ Falhou |
| T10 | A | **Vistoria com foto, API desligada.** Parar o `uvicorn` e repetir T09. | Aguarda no máximo ~15 s; alerta "Salvo em modo offline"; descrição começa com **"[modo offline]"**; o app não trava. | | ☐ Passou ☐ Falhou |
| T11 | A | **Falha simulada.** Perfil → ligar "Simular API offline" → repetir T09 com a API **ligada**. | Mesmo resultado de T10 (falha imediata). Desligar a chave volta ao normal. | | ☐ Passou ☐ Falhou |
| T12 | A | **Sem foto e sem risco.** Vistoria → só escolher o KM → Enviar. | Alerta "Selecione uma classificação de risco ou anexe uma foto."; nada é criado. | | ☐ Passou ☐ Falhou |
| T13 | A | **Sem foto, com risco.** Escolher KM e risco "Alto" → Enviar. | Trecho criado com risco alto, sem etiqueta de IA; Início atualiza contagens. | | ☐ Passou ☐ Falhou |
| T14 | A | **Registrar corte (histórico).** Trechos → abrir um trecho → "Registrar corte realizado" → escrever observação → Confirmar. | Modal de sucesso; trecho **some** de Trechos e do Início; **aparece em Histórico** com data, responsável (seu nome), "atendida em N dias" e a observação; Relatório: "Roçadas no mês" +1. **Com Firebase:** no Console, o documento do trecho **some** de `ocorrencias` e surge um novo em `intervencoes`. | | ☐ Passou ☐ Falhou |
| T15 | A | **Histórico por trecho.** Cadastrar nova vistoria em um KM que já teve corte (ex.: KM 42 no cenário "Dados completos") e abrir o detalhe. | Cartão "Histórico do trecho" lista as roçadas anteriores e "última há N dias". Trecho sem corte mostra "Nenhuma roçada registrada…". | | ☐ Passou ☐ Falhou |
| T16 | B | **Toque duplo no corte.** Confirmar o corte tocando rapidamente 2×. | Apenas **uma** intervenção é criada. | | ☐ Passou ☐ Falhou |
| T17 | A | **Filtros.** Trechos → "Urgente" (e de novo para limpar), "Por KM", "Perto de Mim". | Urgente: só risco alto; Por KM: ordem crescente; Perto de Mim: menor distância primeiro; tocar de novo remove o filtro. | | ☐ Passou ☐ Falhou |
| T18 | A | **Persistência local.** Criar um trecho, fechar o app por completo e reabrir. | O trecho continua lá (e o corte do T14 continua no Histórico). | | ☐ Passou ☐ Falhou |

### 3.3 Estados vazios, erro e cenários de demonstração

| ID | Pri. | Cenário e passos | Resultado esperado | Resultado obtido (descrever o que viu) | Status |
|---|---|---|---|---|---|
| T19 | A | **Lista vazia.** Perfil → "Lista vazia" → confirmar. Visitar Início, Trechos, Histórico e Relatório. | Início: "Nenhum trecho monitorado" + botão; Trechos: "Nenhuma ocorrência registrada."; Histórico: "Nenhuma intervenção registrada"; Relatório: "Nenhum dado para relatar ainda." — **sem** `NaN` nem tela quebrada. | | ☐ Passou ☐ Falhou |
| T20 | A | **Muitos críticos.** Perfil → "Muitos críticos". | Maioria em risco alto; "Prioridade Máxima" lotada; conformidade baixa (vermelho). | | ☐ Passou ☐ Falhou |
| T21 | A | **Dados completos.** Perfil → "Dados completos". | 18 trechos e 14 intervenções; ranking e métricas do Início preenchidos. | | ☐ Passou ☐ Falhou |
| T22 | B | **Filtro sem resultado.** Em "Dados completos" sem urgentes (cortar todos os de risco alto) → filtro "Urgente". | "Nenhuma ocorrência urgente no momento." | | ☐ Passou ☐ Falhou |

### 3.4 Exportação

| ID | Pri. | Cenário e passos | Resultado esperado | Resultado obtido (descrever o que viu) | Status |
|---|---|---|---|---|---|
| T23 | A | **PDF.** Relatório → "Relatório em PDF". | Abre a folha de compartilhamento (mobile) ou a impressão (web); o PDF mostra indicadores, tabela de trechos e histórico. | | ☐ Passou ☐ Falhou |
| T24 | A | **CSV.** Exportar "CSV — trechos" e "CSV — histórico"; abrir no Excel/Planilhas. | Colunas separadas por `;`, acentos corretos, uma linha por registro. Com a lista vazia, os botões ficam desabilitados. | | ☐ Passou ☐ Falhou |

### 3.5 Sincronização (precisa de 2 aparelhos, ou aparelho + navegador)

| ID | Pri. | Cenário e passos | Resultado esperado | Resultado obtido (descrever o que viu) | Status |
|---|---|---|---|---|---|
| T25 | A | **Trecho entre aparelhos.** A: criar trecho. B: entrar com **outra** conta → Perfil → "Sincronizar agora". | O trecho criado em A aparece em B (sem a foto — limitação conhecida). Perfil: "Sincronizado com o Firebase". Console: documento em `ocorrencias`. | | ☐ Passou ☐ Falhou |
| T26 | A | **Corte entre aparelhos.** B: registrar corte do trecho de T25. A: "Sincronizar agora". | Em A, o trecho **sai** da fila e o corte aparece no Histórico. | | ☐ Passou ☐ Falhou |
| T27 | A | **Offline com Firebase.** Modo avião → criar trecho → voltar a rede → "Sincronizar agora". | Trecho criado normalmente; faixa amarela de pendência no Início; após sincronizar, a faixa some e o documento aparece no Console. | | ☐ Passou ☐ Falhou |
| T28 | B | **Regras do Firestore.** Tentar (pelo Console/Playground) apagar uma `intervencoes/{id}` ou ler sem login. | Negado pelas regras (apagar `ocorrencias/{id}` estando logado é permitido). | | ☐ Passou ☐ Falhou |

### 3.6 APK final

| ID | Pri. | Cenário e passos | Resultado esperado | Resultado obtido (descrever o que viu) | Status |
|---|---|---|---|---|---|
| T29 | A | **Instalar o APK** (build `preview`) em um Android sem o Expo Go. | Instala e abre sem erro; ícone/nome corretos; T01, T09 e T14 funcionam com as chaves do Firebase embutidas no build. | | ☐ Passou ☐ Falhou |

## 4. Defeitos encontrados e correções

| # | Caso | O que aconteceu | Causa | Correção (commit) | Re-teste |
|---|---|---|---|---|---|
| | | | | | |

## 5. Pontos de melhoria para depois da Sprint 4

- Firebase Storage para sincronizar as **fotos** entre aparelhos.
- Treinar o XGBoost com **medições reais** da Motiva (hoje o modelo usa dados sintéticos).
- Mapa com a localização dos KMs e rotas da turma de roçada.
- Testes automatizados de interface (Maestro/Detox) para os fluxos T01–T14.

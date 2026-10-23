# 🚁 Drone Vision Watch — Motiva

**Disciplina:** Cross-Platform Application Development · **Curso:** Ciência da Computação — FIAP
**Entrega:** Challenge CCR Motiva — Sprint 4 (versão final) · **Equipe 11**

---

## Integrantes

| Nome                           | RM       |
| ------------------------------ | -------- |
| Auro Vanetti                   | RM563761 |
| Enzo H. K. Nishida             | RM565052 |
| Renan Mano Otero               | RM554911 |
| Marco Antonio Ferreira Fonseca | RM566434 |
| Bruno Soares de Santanna       | RM562235 |
| Enzo Yokokura Araujo           | RM564177 |

---

## Links da entrega

| Item                                        | Link                                                                   |
| ------------------------------------------- | ---------------------------------------------------------------------- |
| 📱 APK final (Android)                      | https://github.com/ferteama/FIAP-CPAD_SPRINT4/releases/tag/version-3.0 |
| 🎬 Vídeo de pitch e demonstração (Sprint 4) | _(colar o link do YouTube não listado)_                                |
| 🎬 Vídeo de demonstração (Sprint 3)         | https://youtu.be/4RbNBSrX2F0                                           |
| 💼 Plano de negócio                         | [`docs/plano-de-negocio.docx`](./docs/plano-de-negocio.docx)           |
| 🧪 Documento de testes manuais              | [`docs/testes-manuais-sprint4.md`](./docs/testes-manuais-sprint4.md)   |

---

## Proposta de solução

A **Motiva** opera mais de 5 mil km de rodovias concessionadas. A gestão da vegetação nas faixas de
domínio (roçada, drenagem, zeladoria — regulada por **ARTESP** e **ANTT**) ainda depende de
**registros manuais**, sem dados atualizados do estado da vegetação, **sem histórico de
intervenções** e sem critério claro de prioridade.

O **Drone Vision Watch** fecha esse ciclo:

```
foto (campo ou drone) → OpenCV mede a cobertura de vegetação → XGBoost estima altura e dias até o limite
   → classificação de risco → trecho entra na fila de prioridade → roçada registrada no histórico
```

- **Quem usa:** operador de campo (registra e executa), supervisor de manutenção (prioriza) e gestor regional (acompanha indicadores e exporta relatórios).
- **O que muda:** o trecho mais crítico aparece primeiro; cada roçada fica registrada (quem, quando, quanto o trecho esperou); o relatório para o órgão regulador sai em PDF/CSV.

### Navegação

| Aba          | Tela              | O que faz                                                                                           |
| ------------ | ----------------- | --------------------------------------------------------------------------------------------------- |
| Início       | `DashboardScreen` | Métricas, ranking de altura por trecho, prioridade máxima, conformidade, indicadores de intervenção |
| Trechos      | `ListaScreen`     | Fila de ocorrências com filtros Urgente / Perto de Mim / Por KM                                     |
| Vistoria     | `CadastroScreen`  | Nova ocorrência: foto (análise automática) ou classificação manual                                  |
| Histórico    | `HistoricoScreen` | Todas as roçadas executadas, com filtro de período e tempo de atendimento                           |
| Relatório    | `RelatorioScreen` | Resumo, tabela por trecho, histórico e **exportação PDF/CSV**                                       |
| Sem aba      | `DetalheScreen`   | Detalhe do trecho, histórico do trecho e **registro de corte**                                      |
| Avatar       | `PerfilScreen`    | Conta, sincronização, cenários de demonstração, sair                                                |
| Antes do app | `LoginScreen`     | Entrar, criar conta, recuperar senha (Firebase Auth)                                                |

---

## Stack

| Camada             | Tecnologia                                                                            |
| ------------------ | ------------------------------------------------------------------------------------- |
| App                | React Native + **Expo** (SDK 56), TypeScript estrito, Context API                     |
| Autenticação       | **Firebase Authentication** (e-mail/senha, sessão persistida com AsyncStorage)        |
| Banco de dados     | **Cloud Firestore** (equipe compartilhada) + **AsyncStorage** (cache offline)         |
| Exportação         | `expo-print` (PDF), `expo-file-system` + `expo-sharing` (CSV)                         |
| Backend de análise | **FastAPI** + **OpenCV** (segmentação HSV) + **XGBoost** (altura e dias até o limite) |
| Build              | **EAS Build** (APK)                                                                   |
| Testes             | Jest + ts-jest (app), pytest (API)                                                    |

### Por que continuamos em React Native/Expo (e não migramos para Flutter)

O protótipo, o app funcional da Sprint 2 e a Sprint 3 já estavam em React Native/Expo, com a equipe
dominando TypeScript. Migrar para Flutter na fase final custaria reescrever ~15 telas/componentes sem
ganho para o usuário, e o risco de regressão iria contra o objetivo da Sprint 4 (corrigir e finalizar).
O Expo também entrega o APK via EAS sem configurar o Android Studio e permite testar no Expo Go.

---

## Resumo das entregas por Sprint

| Sprint | Entrega                                                                                                                                                                                                             |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1      | Protótipo navegável (HTML/JS) com cinco abas e identidade visual Motiva                                                                                                                                             |
| 2      | App Expo com dados mockados, cadastro com foto, detalhe e persistência local; backend FastAPI + OpenCV                                                                                                              |
| 3      | Dashboard com métricas e ranking, navegação por abas, relatório consolidado, filtros funcionais, análise de foto plugada no cadastro com _fallback_ offline, funções estatísticas puras                             |
| 4      | **Login/cadastro com Firebase + sincronização Firestore**, **histórico de intervenções**, **modelo XGBoost**, **exportação PDF/CSV**, mocks ampliados com cenários, testes automatizados, EAS/APK, plano de negócio |

---

## Como a Sprint 4 respondeu ao feedback da Sprint 3

| Feedback do professor                                                    | O que foi feito                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Documento de testes "preenchido estaticamente", com resultados genéricos | Refeito em [`docs/testes-manuais-sprint4.md`](./docs/testes-manuais-sprint4.md): 29 casos com passos reproduzíveis e coluna para **o que de fato foi observado**, ambiente do teste e tabela de defeitos/correções. Separado do que é verificação automática (52 testes Jest, 7 pytest) |
| Mocks com só 4 ocorrências                                               | 18 ocorrências + 14 intervenções, datas relativas a "hoje" e **3 cenários** selecionáveis em _Perfil_ (completo, muitos críticos, lista vazia) + chave **"Simular API offline"** para demonstrar o estado de erro                                                                       |
| "Registrar corte" só apagava a ocorrência                                | Agora cria uma **Intervenção** (responsável, datas, altura antes, observação) que nunca é apagada: aparece em _Histórico_, no detalhe do trecho, no Relatório e alimenta o **tempo médio de atendimento** e a **reincidência por trecho**                                               |
| Pasta `.expo` versionada                                                 | Removida e adicionada ao `.gitignore` (veja o comando abaixo para tirar do histórico do seu clone)                                                                                                                                                                                      |

---

## Funcionalidades

| Requisito                                                                                                                               | Status | Onde                                                            |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------- |
| Login, criar conta, recuperar senha, sair                                                                                               | ✅     | `LoginScreen`, `AuthContext`, `services/authService.ts`         |
| Sessão persistente e modo demonstração (sem Firebase)                                                                                   | ✅     | `services/firebase.ts`                                          |
| Sincronização offline-first com Firestore (postagens salvas; a postagem é apagada do banco ao registrar o corte, o histórico permanece) | ✅     | `OcorrenciasContext`, `utils/sincronizacao.ts`                  |
| Dashboard (status, ranking, conformidade, indicadores de intervenção)                                                                   | ✅     | `DashboardScreen`, `utils/estatisticas.ts`                      |
| Cadastro com foto → análise → classificação; fallback offline                                                                           | ✅     | `CadastroScreen`, `services/vegetationApi.ts` (timeout de 15 s) |
| Modelo XGBoost (altura e dias até o limite)                                                                                             | ✅ ¹   | `backend/modelo.py`, `treinar_modelo.py`                        |
| Registro de corte com histórico de intervenções                                                                                         | ✅     | `DetalheScreen`, `utils/intervencoes.ts`, `HistoricoScreen`     |
| Exportação em PDF e CSV                                                                                                                 | ✅     | `RelatorioScreen`, `utils/exportacao.ts`                        |
| Filtros da lista; estados vazios e de erro                                                                                              | ✅     | `ListaScreen`, `PerfilScreen`                                   |
| APK final                                                                                                                               | ✅     | Já presente no releases do GitHub                               |
| Vídeo de pitch                                                                                                                          | ✅     | gravar (roteiro em `docs/roteiro-pitch.docx`)                   |

¹ **O modelo é treinado com dados sintéticos.** A Motiva não forneceu medições reais; o gerador (`gerar_dataset`)
codifica uma dinâmica plausível (mais calor e chuva → crescimento mais rápido). As métricas de
`backend/modelos/metricas.json` medem o ajuste a esse gerador, **não** a precisão em campo. Com dados
reais basta trocar `gerar_dataset` por um CSV e rodar `python treinar_modelo.py`.

² Dependem de passos manuais da equipe (conta Expo, gravação).

### Limitações conhecidas

- As **fotos não sincronizam** entre aparelhos (ficam só onde foram tiradas); seria necessário o Firebase Storage.
- "Perto de Mim" ordena por uma distância **simulada** (não usa GPS).
- A segmentação HSV considera "verde" = vegetação; sombras e grama seca reduzem a cobertura medida.
- Sem conta Firebase configurada, o app roda em modo demonstração (dados só no aparelho).

---

## Como executar

### 1. App

```bash
npm install
cp .env.example .env     # preencha EXPO_PUBLIC_API_URL e as chaves do Firebase
npx expo start -c
```

Escaneie o QR code com o **Expo Go**, ou pressione `w` para abrir no navegador. Sem `.env` o app abre em
**modo demonstração**. Configuração do Firebase: [`docs/firebase-setup.md`](./docs/firebase-setup.md).

### 2. API de análise (opcional para a demonstração)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Os modelos treinados já estão em `backend/modelos/`. Para re-treinar: `python treinar_modelo.py`.
Detalhes e _deploy_ em [`backend/README.md`](./backend/README.md). Sem a API, o app usa o _fallback_ simulado.

### 3. Testes

```bash
npm run typecheck      # TypeScript estrito
npm test               # 52 testes do app
cd backend && pytest -q   # 7 testes da API
```

### 4. Gerar o APK

```bash
npm install -g eas-cli
eas login
eas init                                 # 1ª vez: cria/vincula o projeto no Expo e grava o projectId no app.json
# cadastre as variáveis EXPO_PUBLIC_* no EAS (o build não lê o seu .env) — veja docs/firebase-setup.md
eas build --platform android --profile preview
```

Ao terminar, o EAS mostra um link para baixar o `.apk`.

**Instalar:** baixe o `.apk` no celular Android → abra → permita "instalar apps de fontes desconhecidas" quando
solicitado → **Instalar**.

---

## Estrutura de pastas

```
├── App.tsx                         # Porteiro de autenticação + navegação por abas
├── eas.json · app.json · jest.config.js · .env.example
├── firebase/firestore.rules        # Regras de segurança do Firestore
├── __tests__/                      # 52 testes das funções puras e dos mocks
├── src/
│   ├── screens/                    # Login, Dashboard, Lista, Cadastro, Histórico, Relatório, Detalhe, Perfil
│   ├── components/                 # OcorrenciaCard, FilterChip, RankingBarra, EstatisticaCard, BottomNav
│   ├── context/                    # AuthContext, OcorrenciasContext, ConfigDemoContext
│   ├── services/                   # firebase, authService, firestoreService, vegetationApi, exportacaoService
│   ├── interfaces/ · types/        # Ocorrencia, Intervencao, NivelRisco
│   ├── data/ocorrencias.ts         # Mocks e cenários de demonstração
│   └── utils/                      # estatisticas, datas, sincronizacao, intervencoes, exportacao, validacao, tema…
├── backend/
│   ├── main.py                     # FastAPI + OpenCV + XGBoost
│   ├── modelo.py · treinar_modelo.py · modelos/
│   └── tests/test_api.py
└── docs/                           # testes, plano de negócio, guia de integração de api
```

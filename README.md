# 🚁 Drone Vision Watch — Motiva

**Disciplina:** Cross-Platform Application Development
**Curso:** Ciência da Computação — FIAP
**Entrega:** Challenge Motiva — Equipe 11

---

## Integrantes

| Nome | RM |
|------|----|
| Auro Vanetti | RM563761 |
| Enzo H. K. Nishida | RM565052 |
| Renan Mano Otero | RM554911 |
| Marco Antonio Ferreira Fonseca | RM566434 |
| Bruno Soares de Santanna | RM562235 |
| Enzo Yokokura Araujo | RM564177 |

---

## Sobre o Projeto

O **Drone Vision Watch** é um aplicativo mobile para operadores de campo da
**Motiva**, empresa responsável pela manutenção de faixas de domínio em
rodovias. O app simula o monitoramento de vegetação detectado por drones,
com uma etapa de análise por **visão computacional (OpenCV)** e previsão
de crescimento inspirada em **XGBoost**.

O fluxo completo é: foto tirada em campo (ou pelo drone) → análise da
imagem → altura estimada e classificação de risco → registro na lista de
ocorrências, com histórico e status persistidos entre sessões. Um painel
(Dashboard) consolida essas ocorrências em métricas para o operador
priorizar onde agir primeiro.

### Navegação

O app tem 4 abas fixas na barra inferior, mais uma tela de detalhe (drill-down):

| Aba | Tela | Descrição |
|-----|------|-----------|
| Início | `DashboardScreen` | Painel com métricas, ranking de altura por trecho e prioridades |
| Trechos | `ListaScreen` | Lista de ocorrências, com filtros (Urgente / Perto de Mim / Por KM) |
| Vistoria | `CadastroScreen` | Registro de nova ocorrência (foto ou classificação manual) |
| Relatório | `RelatorioScreen` | Resumo consolidado + tabela detalhada por trecho |
| _(sem aba)_ | `DetalheScreen` | Detalhe de uma ocorrência específica, acessado a partir do Início ou de Trechos |

---

## Funcionalidades Implementadas

| Requisito | Implementado |
|-----------|-------------|
| Dashboard com métricas (status, altura média, ranking, conformidade) | ✅ `src/screens/DashboardScreen.tsx` + `src/utils/estatisticas.ts` |
| Navegação por abas (Início / Trechos / Vistoria / Relatório) | ✅ `src/components/BottomNav.tsx` + `App.tsx` |
| Lista de ocorrências detectadas, com filtros funcionais | ✅ `src/screens/ListaScreen.tsx` |
| Cadastro de nova ocorrência, com foto (câmera ou galeria) | ✅ `src/screens/CadastroScreen.tsx` |
| Detalhe completo de cada ocorrência | ✅ `src/screens/DetalheScreen.tsx` |
| Relatório consolidado (resumo + tabela por trecho) | ✅ `src/screens/RelatorioScreen.tsx` |
| Cálculo automático do risco a partir da altura da grama | ✅ `src/utils/formatadores.ts` |
| Persistência local entre sessões | ✅ `src/context/OcorrenciasContext.tsx` + AsyncStorage |
| Registrar corte realizado (remove a ocorrência ativa) | ✅ `src/screens/DetalheScreen.tsx` |
| Análise de foto por visão computacional (API própria), **plugada no fluxo de cadastro** com fallback automático para modo simulado | ✅ `src/services/vegetationApi.ts` + `backend/main.py` + `CadastroScreen.tsx` |

### Pendências conhecidas / plano de ajustes (Sprint 4)

- [ ] Gerar e testar o **APK final** (Expo EAS Build ou equivalente).
- [ ] Substituir a segmentação de cor (HSV) do backend por um modelo
      **XGBoost** treinado com dados reais de (cobertura, chuva,
      temperatura) → altura, como sugerido no desafio.
- [ ] Exportação do Relatório em PDF/CSV (hoje é somente visual em tela).
- [ ] Elaborar o plano de negócio da solução (Sprint 4).
- [ ] Preencher o link do vídeo de pitch final (Sprint 4).

---

## Estrutura de Pastas

```
drone-vision-watch/
├── App.tsx                        # Raiz — navegação por abas + drill-down (useState)
├── index.js                       # Entry point (registerRootComponent)
├── app.json                       # Configuração Expo
├── package.json
├── tsconfig.json
├── .env.example                   # Modelo de variáveis de ambiente (URL da API)
│
├── assets/                        # Ícones e imagens estáticas
│
├── src/
│   ├── screens/                   # Telas do app
│   │   ├── DashboardScreen.tsx    # Aba "Início" — painel de métricas
│   │   ├── ListaScreen.tsx        # Aba "Trechos" — lista de ocorrências + filtros
│   │   ├── CadastroScreen.tsx     # Aba "Vistoria" — cadastro com foto ou manual
│   │   ├── RelatorioScreen.tsx    # Aba "Relatório" — resumo + tabela detalhada
│   │   └── DetalheScreen.tsx      # Detalhe da ocorrência (sem aba própria)
│   │
│   ├── components/                # Componentes reutilizáveis
│   │   ├── OcorrenciaCard.tsx
│   │   ├── FilterChip.tsx
│   │   ├── RankingBarra.tsx       # Barra do ranking "Altura por Trecho" (Dashboard)
│   │   ├── EstatisticaCard.tsx    # Card compacto de métrica (Dashboard)
│   │   ├── BottomNav.tsx          # Navegação inferior por abas
│   │   └── index.ts               # Barrel export
│   │
│   ├── interfaces/                # Contratos de dados (objetos)
│   │   └── ocorrencia.ts          # interface Ocorrencia
│   │
│   ├── types/                     # Union types simples
│   │   └── nivelRisco.ts          # "baixo" | "medio" | "alto"
│   │
│   ├── data/                      # Dados iniciais (mock)
│   │   └── ocorrencias.ts
│   │
│   ├── context/                   # Estado global
│   │   └── OcorrenciasContext.tsx # useState + AsyncStorage
│   │
│   ├── services/                  # Comunicação com APIs externas
│   │   └── vegetationApi.ts       # Envia foto → recebe altura/risco da API
│   │
│   └── utils/                     # Funções puras / design tokens
│       ├── tema.ts                # Cores, sombras (identidade Motiva)
│       ├── formatadores.ts        # calcularRisco, dataHoje, etc.
│       └── estatisticas.ts        # Métricas do Dashboard/Relatório (contagens, médias, ranking)
│
├── backend/                       # API de análise de vegetação (Python)
│   ├── main.py                    # FastAPI + OpenCV — segmentação de cor
│   ├── requirements.txt
│   └── README.md                  # Como rodar e fazer deploy da API
│
└── docs/
    ├── exemplo-integracao-api.tsx     # Exemplo original de uso do vegetationApi
    └── testes-manuais-sprint3.md      # Documento de testes manuais (Sprint 3)
```

---

## Como Executar

### App (Expo)

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar o servidor de desenvolvimento
npx expo start
```

Depois, escaneie o QR code com o app **Expo Go** no celular, ou pressione
`w` no terminal para abrir no navegador.

> Se o `npx expo start` falhar, o motivo mais comum é rodar o comando fora
> da pasta raiz do projeto, ou não ter rodado `npm install` antes. Confira
> se `package.json` está na pasta onde você está executando o comando.

### API de análise de vegetação (opcional, para testar a integração real)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Depois, copie `.env.example` para `.env` na raiz do projeto e configure
`EXPO_PUBLIC_API_URL` com o IP da sua máquina na rede local. Detalhes em
[`backend/README.md`](./backend/README.md).

Sem a API rodando, o app não quebra — `vegetationApi.ts` tem um modo
simulado (`analisarFotoVegetacaoSimulado`) usado como fallback.

---

## Conceitos Aplicados

- **Context API** — estado das ocorrências compartilhado entre todas as telas
- **AsyncStorage** — ocorrências persistem entre sessões do app
- **TypeScript** — interfaces, union types, tipagem de props e estado
- **Componentização** — `OcorrenciaCard`, `FilterChip`, `RankingBarra`, `EstatisticaCard` e `BottomNav` reutilizáveis
- **Navegação por abas** — 4 abas + drill-down controlados por `useState` em `App.tsx` (sem lib de navegação)
- **Integração com API externa** — captura de foto → upload multipart → resposta JSON, **plugada de fato no fluxo de cadastro**
- **Visão computacional** — segmentação HSV com OpenCV no backend, para estimar cobertura de vegetação
- **Fallback resiliente** — modo simulado quando a API está indisponível (usado tanto na análise de foto quanto nos dados mockados)
- **Funções puras para métricas** — `src/utils/estatisticas.ts` calcula todo o Dashboard e Relatório sem tocar em estado do React

---

## Vídeo de Demonstração

> Link: _(adicionar após publicação no YouTube como "Não listado")_

Roteiro completo em [`Roteiro_Final_Equipe11.docx`](../Roteiro_Final_Equipe11.docx).

---

## Entrega Sprint 3

Conforme o enunciado, a entrega é **apenas um arquivo `.txt`** contendo:
nome e RM de cada integrante (tabela acima), link do repositório GitHub
atualizado e link do vídeo de demonstração (YouTube, não listado). Não
enviar pelo Teams nem fora do prazo.

Documento de testes manuais: [`docs/testes-manuais-sprint3.md`](./docs/testes-manuais-sprint3.md).

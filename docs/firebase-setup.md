# Configuração do Firebase (Authentication + Firestore)

O app funciona **sem** Firebase (modo demonstração local), mas o login real e a
sincronização entre aparelhos dependem destes passos. São ~10 minutos.

## 1. Criar o projeto

1. Acesse <https://console.firebase.google.com> → **Adicionar projeto** (ex.: `drone-vision-watch`).
2. Pode desativar o Google Analytics.

## 2. Ativar o login por e-mail/senha

**Build → Authentication → Sign-in method → E-mail/senha → Ativar.**

## 3. Criar o Firestore

**Build → Firestore Database → Criar banco de dados** (modo produção, região `southamerica-east1`).
Depois, em **Regras**, cole o conteúdo (**republique sempre que o arquivo mudar**) de [`firebase/firestore.rules`](../firebase/firestore.rules) e **Publicar**.

## 4. Registrar o app e copiar as chaves

**Configurações do projeto (engrenagem) → Seus apps → `</>` (Web)** → registre um app
(ex.: `dvw-app`) → copie o objeto `firebaseConfig`.

Copie `.env.example` para `.env` e preencha:

| `.env`                                     | `firebaseConfig`    |
| ------------------------------------------ | ------------------- |
| `EXPO_PUBLIC_FIREBASE_API_KEY`             | `apiKey`            |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`         | `authDomain`        |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID`          | `projectId`         |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`      | `storageBucket`     |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `EXPO_PUBLIC_FIREBASE_APP_ID`              | `appId`             |

> A `apiKey` do Firebase **não é um segredo** (ela identifica o projeto; quem protege os
> dados são as regras do Firestore), mas mesmo assim o `.env` fica fora do Git.

Reinicie o Expo com cache limpo: `npx expo start -c`.

## 5. APK com as chaves do Firebase

O EAS Build **não lê o seu `.env` local**. Cadastre as mesmas variáveis no EAS:

```bash
eas init   # só na 1ª vez
eas env:create --environment preview --name EXPO_PUBLIC_FIREBASE_API_KEY --value "..." --visibility plaintext
# repita para as demais EXPO_PUBLIC_FIREBASE_* e para EXPO_PUBLIC_API_URL
eas build --platform android --profile preview
```

## Modelo de dados

| Coleção        | Documento | Observações                                                                                                                 |
| -------------- | --------- | --------------------------------------------------------------------------------------------------------------------------- |
| `users`        | `{uid}`   | nome, e-mail, cargo, criadoEm                                                                                               |
| `ocorrencias`  | `{id}`    | postagem do trecho em monitoramento (sem `fotoUri`: a foto fica só no aparelho). **É apagada quando a roçada é registrada** |
| `intervencoes` | `{id}`    | roçadas executadas — imutáveis; é o histórico permanente e também a "lápide" da postagem apagada                            |

## Como a sincronização funciona

- O app grava **primeiro no aparelho** (AsyncStorage) e depois no Firestore (melhor esforço) — por isso funciona offline.
- Ao abrir o app e em **Perfil → Sincronizar agora**, faz-se a mesclagem local × remota (`src/utils/sincronizacao.ts`, coberta por testes).
- Dados de demonstração (`origem: "mock"`) nunca são enviados ao Firestore — a coleção `ocorrencias` só aparece depois que **você cria um trecho** pelo app.
- **Ao registrar o corte**, o app grava a intervenção em `intervencoes` e, em seguida, apaga a postagem de `ocorrencias`. Se estiver offline, a próxima sincronização conclui a exclusão.
- Cortar um trecho de demonstração não grava nada no Firestore.

## Limitações conhecidas

- **Fotos não sincronizam** entre aparelhos (precisaria do Firebase Storage).
- Conflitos de edição usam "o remoto vence"; como ocorrências não são editadas após criadas, isso não é um problema hoje.
- As regras e o fluxo de login/sincronização **não foram executados contra um projeto Firebase real** neste ambiente de desenvolvimento — validar com o checklist de `docs/testes-manuais-sprint4.md`.

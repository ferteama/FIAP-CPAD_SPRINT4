/**
 * firebase.ts
 * ─────────────────────────────────────────────────────────────
 * Inicialização única do Firebase (Authentication + Firestore).
 *
 * As chaves vêm de variáveis EXPO_PUBLIC_FIREBASE_* (.env — veja
 * .env.example e docs/firebase-setup.md). Se estiverem ausentes, o app NÃO
 * quebra: `firebaseConfigurado` fica false, `auth`/`db` ficam null e a tela
 * de login oferece o modo demonstração local.
 */

import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { Firestore, getFirestore, initializeFirestore } from "firebase/firestore";
// No React Native, a persistência de sessão vem do build "react-native" de
// @firebase/auth (resolvido pelo Metro via "exports"). O pacote "firebase/auth"
// aponta para o build web e não a exporta — por isso o import abaixo.
import * as FirebaseAuthRN from "@firebase/auth";

import { configuracaoValida } from "./firebaseConfig";

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "",
};

export const firebaseConfigurado = configuracaoValida(config);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (firebaseConfigurado) {
  try {
    app = getApps().length ? getApp() : initializeApp(config);

    // Persistência de sessão: no mobile usa AsyncStorage; na web, o padrão do SDK.
    const getRNPersistence = (FirebaseAuthRN as any).getReactNativePersistence;
    if (Platform.OS !== "web" && typeof getRNPersistence === "function") {
      try {
        auth = FirebaseAuthRN.initializeAuth(app, {
          persistence: getRNPersistence(AsyncStorage),
        });
      } catch {
        // Fast Refresh: o Auth já foi inicializado nesta sessão
        auth = getAuth(app);
      }
    } else {
      auth = getAuth(app);
    }

    try {
      // Long polling evita travamentos de conexão do Firestore em alguns redes/emuladores
      db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
        ignoreUndefinedProperties: true,
      });
    } catch {
      db = getFirestore(app);
    }
  } catch (e) {
    console.warn("[firebase] Falha ao inicializar — seguindo sem Firebase:", e);
    app = null;
    auth = null;
    db = null;
  }
}

export { app, auth, db };

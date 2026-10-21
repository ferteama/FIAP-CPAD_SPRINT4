/**
 * authService.ts — login/cadastro com Firebase Authentication e perfil no
 * Firestore (coleção `users/{uid}`). Nenhuma função aqui é chamada quando o
 * Firebase não está configurado (o AuthContext cuida disso).
 */

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, db } from "./firebase";

export type UsuarioApp = {
  uid: string;
  nome: string;
  email: string;
  cargo?: string;
  /** true = sessão local de demonstração (sem Firebase). */
  demo?: boolean;
};

function exigirAuth() {
  if (!auth) throw Object.assign(new Error("Firebase não configurado"), { code: "app/firebase-off" });
  return auth;
}

async function lerCargo(uid: string): Promise<string | undefined> {
  if (!db) return undefined;
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? (snap.data().cargo as string | undefined) : undefined;
  } catch {
    return undefined; // perfil é complementar; não bloqueia o login
  }
}

export async function usuarioDoFirebase(u: User): Promise<UsuarioApp> {
  return {
    uid: u.uid,
    nome: u.displayName || u.email?.split("@")[0] || "Operador",
    email: u.email ?? "",
    cargo: await lerCargo(u.uid),
  };
}

export async function cadastrarUsuario(
  nome: string,
  email: string,
  senha: string,
  cargo: string
): Promise<UsuarioApp> {
  const a = exigirAuth();
  const cred = await createUserWithEmailAndPassword(a, email.trim(), senha);
  await updateProfile(cred.user, { displayName: nome.trim() });

  if (db) {
    try {
      await setDoc(doc(db, "users", cred.user.uid), {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        cargo: cargo.trim() || "Operador de campo",
        criadoEm: serverTimestamp(),
      });
    } catch (e) {
      console.warn("[auth] Conta criada, mas o perfil não foi salvo:", e);
    }
  }
  return { uid: cred.user.uid, nome: nome.trim(), email: email.trim(), cargo: cargo.trim() || "Operador de campo" };
}

export async function entrarComEmail(email: string, senha: string): Promise<UsuarioApp> {
  const cred = await signInWithEmailAndPassword(exigirAuth(), email.trim(), senha);
  return usuarioDoFirebase(cred.user);
}

export async function recuperarSenha(email: string): Promise<void> {
  await sendPasswordResetEmail(exigirAuth(), email.trim());
}

export async function sairDaConta(): Promise<void> {
  if (auth) await signOut(auth);
}

/** Observa o estado de autenticação. Retorna a função de cancelamento. */
export function observarAutenticacao(
  aoMudar: (usuario: UsuarioApp | null) => void
): () => void {
  if (!auth) {
    aoMudar(null);
    return () => {};
  }
  return onAuthStateChanged(auth, async (u) => {
    aoMudar(u ? await usuarioDoFirebase(u) : null);
  });
}

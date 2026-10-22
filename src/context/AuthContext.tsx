import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { firebaseConfigurado } from "../services/firebase";
import {
  UsuarioApp,
  cadastrarUsuario,
  entrarComEmail,
  observarAutenticacao,
  recuperarSenha as recuperarSenhaFirebase,
  sairDaConta,
} from "../services/authService";
import { traduzirErroAuth } from "../utils/validacao";

interface AuthContextType {
  usuario: UsuarioApp | null;
  /** true enquanto o Firebase ainda restaura a sessão salva. */
  carregando: boolean;
  /** false = chaves do Firebase ausentes → só modo demonstração. */
  firebaseAtivo: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (nome: string, email: string, senha: string, cargo: string) => Promise<void>;
  recuperarSenha: (email: string) => Promise<void>;
  entrarModoDemo: () => void;
  sair: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USUARIO_DEMO: UsuarioApp = {
  uid: "demo",
  nome: "Operador Demo",
  email: "demo@local",
  cargo: "Operador de campo",
  demo: true,
};

/** Lança Error com mensagem já traduzida para o operador. */
async function comMensagemAmigavel<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e: any) {
    console.warn("[auth] erro:", e?.code ?? "", e?.message ?? e);
    throw new Error(traduzirErroAuth(e?.code));
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioApp | null>(null);
  const [carregando, setCarregando] = useState(firebaseConfigurado);

  useEffect(() => {
    if (!firebaseConfigurado) return;
    const cancelar = observarAutenticacao((u) => {
      setUsuario(u);
      setCarregando(false);
    });
    return cancelar;
  }, []);

  const entrar = useCallback(
    (email: string, senha: string) =>
      comMensagemAmigavel(async () => {
        setUsuario(await entrarComEmail(email, senha));
      }),
    []
  );

  const cadastrar = useCallback(
    (nome: string, email: string, senha: string, cargo: string) =>
      comMensagemAmigavel(async () => {
        setUsuario(await cadastrarUsuario(nome, email, senha, cargo));
      }),
    []
  );

  const recuperarSenha = useCallback(
    (email: string) => comMensagemAmigavel(() => recuperarSenhaFirebase(email)),
    []
  );

  const entrarModoDemo = useCallback(() => setUsuario(USUARIO_DEMO), []);

  const sair = useCallback(async () => {
    if (usuario?.demo) {
      setUsuario(null);
      return;
    }
    await sairDaConta();
    setUsuario(null);
  }, [usuario]);

  const valor = useMemo(
    () => ({
      usuario,
      carregando,
      firebaseAtivo: firebaseConfigurado,
      entrar,
      cadastrar,
      recuperarSenha,
      entrarModoDemo,
      sair,
    }),
    [usuario, carregando, entrar, cadastrar, recuperarSenha, entrarModoDemo, sair]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}

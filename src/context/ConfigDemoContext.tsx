import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CHAVE = "@dronewatchmotiva:config";

interface ConfigDemoContextType {
  /** Força a falha da API de análise (para demonstrar o fallback offline). */
  simularApiOffline: boolean;
  definirSimularApiOffline: (valor: boolean) => void;
}

const ConfigDemoContext = createContext<ConfigDemoContextType | undefined>(undefined);

export function ConfigDemoProvider({ children }: { children: React.ReactNode }) {
  const [simularApiOffline, setSimular] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CHAVE)
      .then((json) => {
        if (json) setSimular(Boolean(JSON.parse(json).simularApiOffline));
      })
      .catch(() => {});
  }, []);

  const definirSimularApiOffline = useCallback((valor: boolean) => {
    setSimular(valor);
    AsyncStorage.setItem(CHAVE, JSON.stringify({ simularApiOffline: valor })).catch(() => {});
  }, []);

  const valor = useMemo(
    () => ({ simularApiOffline, definirSimularApiOffline }),
    [simularApiOffline, definirSimularApiOffline]
  );

  return <ConfigDemoContext.Provider value={valor}>{children}</ConfigDemoContext.Provider>;
}

export function useConfigDemo(): ConfigDemoContextType {
  const ctx = useContext(ConfigDemoContext);
  if (!ctx) throw new Error("useConfigDemo deve ser usado dentro de <ConfigDemoProvider>");
  return ctx;
}

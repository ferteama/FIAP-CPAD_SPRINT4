import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Ocorrencia } from "../interfaces/ocorrencia";
import { ocorrenciasIniciais } from "../data/ocorrencias";
import { proximoId } from "../utils/formatadores";

// Chave de persistência 
const STORAGE_KEY = "@dronewatchmotiva:ocorrencias";

// ── Contrato do contexto ──

interface OcorrenciasContextType {
  ocorrencias: Ocorrencia[];
  carregando: boolean;
  adicionarOcorrencia: (nova: Omit<Ocorrencia, "id">) => Promise<void>;
  removerOcorrencia: (id: number) => Promise<void>;
}

// ── Criação do contexto ──

const OcorrenciasContext = createContext<OcorrenciasContextType | undefined>(
  undefined
);

// ── Provider ──

export function OcorrenciasProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ocorrencias, setOcorrencias] =
    useState<Ocorrencia[]>(ocorrenciasIniciais);
  const [carregando, setCarregando] = useState(true);

  // Carrega dados persistidos no AsyncStorage ao iniciar o app
  useEffect(() => {
    async function carregar() {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (json) {
          setOcorrencias(JSON.parse(json));
        }
        // Se não houver nada salvo, mantém os dados mockados iniciais
      } catch (e) {
        console.error("Erro ao carregar ocorrências:", e);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  // Persiste automaticamente sempre que o estado mudar
  useEffect(() => {
    if (!carregando) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ocorrencias)).catch(
        (e) => console.error("Erro ao salvar ocorrências:", e)
      );
    }
  }, [ocorrencias, carregando]);

  // Adiciona nova ocorrência no estado e persiste
  const adicionarOcorrencia = useCallback(
    async (nova: Omit<Ocorrencia, "id">) => {
      setOcorrencias((prev) => {
        const id = proximoId(prev.map((o) => o.id));
        const completa: Ocorrencia = { ...nova, id };
        return [completa, ...prev]; // mais recente primeiro
      });
    },
    []
  );

  // Remove uma ocorrência pelo id
  const removerOcorrencia = useCallback(async (id: number) => {
    setOcorrencias((prev) => prev.filter((o) => o.id !== id));
  }, []);

  return (
    <OcorrenciasContext.Provider
      value={{ ocorrencias, carregando, adicionarOcorrencia, removerOcorrencia }}
    >
      {children}
    </OcorrenciasContext.Provider>
  );
}

// ── Custom Hook ──

/**
 * Hook para acessar o contexto de ocorrências.
 * Lança erro se usado fora do <OcorrenciasProvider>.
 */
export function useOcorrencias(): OcorrenciasContextType {
  const ctx = useContext(OcorrenciasContext);
  if (!ctx) {
    throw new Error(
      "useOcorrencias deve ser usado dentro de <OcorrenciasProvider>"
    );
  }
  return ctx;
}

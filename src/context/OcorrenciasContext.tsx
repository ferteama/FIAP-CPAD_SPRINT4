import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Ocorrencia } from "../interfaces/ocorrencia";
import { Intervencao } from "../interfaces/intervencao";
import { CenarioDados, montarCenario } from "../data/ocorrencias";
import { gerarId } from "../utils/formatadores";
import { criarIntervencao } from "../utils/intervencoes";
import { mesclarIntervencoes, mesclarOcorrencias } from "../utils/sincronizacao";
import { firebaseConfigurado } from "../services/firebase";
import {
  buscarIntervencoes,
  buscarOcorrencias,
  excluirOcorrencia,
  salvarIntervencao,
  salvarOcorrencia,
} from "../services/firestoreService";
import { useAuth } from "./AuthContext";

// Cada usuário tem seu cache local; o Firestore é a fonte compartilhada da equipe.
const chaveStorage = (uid: string) => `@dronewatchmotiva:v2:${uid}:dados`;

export type StatusSync = "desativado" | "sincronizando" | "ok" | "pendente" | "erro";

interface OcorrenciasContextType {
  ocorrencias: Ocorrencia[];
  intervencoes: Intervencao[];
  carregando: boolean;
  statusSync: StatusSync;
  ultimaSync: number | null;
  adicionarOcorrencia: (nova: Omit<Ocorrencia, "id">) => Promise<Ocorrencia>;
  /** Registra a roçada: grava no histórico e tira o trecho da fila ativa. */
  registrarCorte: (ocorrencia: Ocorrencia, observacao?: string) => Promise<Intervencao | null>;
  carregarCenario: (cenario: CenarioDados) => Promise<void>;
  sincronizar: () => Promise<void>;
}

const OcorrenciasContext = createContext<OcorrenciasContextType | undefined>(undefined);

export function OcorrenciasProvider({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth();
  const uid = usuario?.uid ?? "anonimo";
  const remotoAtivo = firebaseConfigurado && !!usuario && !usuario.demo;

  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [intervencoes, setIntervencoes] = useState<Intervencao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [statusSync, setStatusSync] = useState<StatusSync>(remotoAtivo ? "pendente" : "desativado");
  const [ultimaSync, setUltimaSync] = useState<number | null>(null);

  // Refs com o estado mais recente (a sincronização é assíncrona)
  const ocRef = useRef(ocorrencias);
  const ivRef = useRef(intervencoes);
  ocRef.current = ocorrencias;
  ivRef.current = intervencoes;

  const sincronizar = useCallback(async () => {
    if (!remotoAtivo) return;
    setStatusSync("sincronizando");
    try {
      const [ocRemotas, ivRemotas] = await Promise.all([
        buscarOcorrencias(),
        buscarIntervencoes(),
      ]);

      const iv = mesclarIntervencoes(ivRef.current, ivRemotas);
      const oc = mesclarOcorrencias(ocRef.current, ocRemotas, iv.resultado);
      setIntervencoes(iv.resultado);
      setOcorrencias(oc.resultado);

      // 1º o histórico (nunca se perde), 2º as postagens novas, 3º apaga as já roçadas
      await Promise.all(iv.paraEnviar.map(salvarIntervencao));
      await Promise.all(oc.paraEnviar.map(salvarOcorrencia));
      await Promise.all(oc.paraExcluirRemoto.map((o) => excluirOcorrencia(o.id)));
      setStatusSync("ok");
      setUltimaSync(Date.now());
    } catch (e) {
      console.warn("[sync] Falha ao sincronizar:", e);
      setStatusSync("erro");
    }
  }, [remotoAtivo]);

  // Carrega o cache local; sem cache, parte dos dados de demonstração
  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      try {
        const json = await AsyncStorage.getItem(chaveStorage(uid));
        if (cancelado) return;
        if (json) {
          const dados = JSON.parse(json);
          setOcorrencias(dados.ocorrencias ?? []);
          setIntervencoes(dados.intervencoes ?? []);
        } else {
          const seed = montarCenario("completo");
          setOcorrencias(seed.ocorrencias);
          setIntervencoes(seed.intervencoes);
        }
      } catch (e) {
        console.error("Erro ao carregar dados locais:", e);
        const seed = montarCenario("completo");
        setOcorrencias(seed.ocorrencias);
        setIntervencoes(seed.intervencoes);
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }
    carregar();
    return () => {
      cancelado = true;
    };
  }, [uid]);

  // Primeira sincronização depois que o cache foi carregado
  useEffect(() => {
    if (!carregando && remotoAtivo) sincronizar();
  }, [carregando, remotoAtivo, sincronizar]);

  // Persiste localmente a cada mudança
  useEffect(() => {
    if (carregando) return;
    AsyncStorage.setItem(chaveStorage(uid), JSON.stringify({ ocorrencias, intervencoes })).catch(
      (e) => console.error("Erro ao salvar dados locais:", e)
    );
  }, [ocorrencias, intervencoes, carregando, uid]);

  const adicionarOcorrencia = useCallback(
    async (nova: Omit<Ocorrencia, "id">) => {
      const completa: Ocorrencia = {
        ...nova,
        id: gerarId("oc"),
        origem: nova.origem ?? "manual",
        criadoPor: nova.criadoPor ?? usuario?.nome,
      };
      setOcorrencias((prev) => [completa, ...prev]); // mais recente primeiro
      if (remotoAtivo) {
        salvarOcorrencia(completa).catch(() => setStatusSync("pendente"));
      }
      return completa;
    },
    [usuario, remotoAtivo]
  );

  const registrarCorte = useCallback(
    async (ocorrencia: Ocorrencia, observacao?: string) => {
      // Proteção contra toque duplo: se o trecho já saiu da fila, não duplica o histórico
      if (!ocRef.current.some((o) => o.id === ocorrencia.id)) return null;

      const intervencao = criarIntervencao(ocorrencia, usuario?.nome ?? "Operador", observacao);

      setIntervencoes((prev) => [intervencao, ...prev]);
      setOcorrencias((prev) => prev.filter((o) => o.id !== ocorrencia.id));
      // Remoto: grava o histórico e, só depois, apaga a postagem. Se falhar (offline),
      // a próxima sincronização refaz — a intervenção local é a "lápide" da postagem.
      if (remotoAtivo && intervencao.origem !== "mock") {
        salvarIntervencao(intervencao)
          .then(() => excluirOcorrencia(ocorrencia.id))
          .catch(() => setStatusSync("pendente"));
      }
      return intervencao;
    },
    [usuario, remotoAtivo]
  );

  const carregarCenario = useCallback(async (cenario: CenarioDados) => {
    const dados = montarCenario(cenario);
    setOcorrencias(dados.ocorrencias);
    setIntervencoes(dados.intervencoes);
  }, []);

  const valor = useMemo(
    () => ({
      ocorrencias,
      intervencoes,
      carregando,
      statusSync: remotoAtivo ? statusSync : ("desativado" as StatusSync),
      ultimaSync,
      adicionarOcorrencia,
      registrarCorte,
      carregarCenario,
      sincronizar,
    }),
    [
      ocorrencias,
      intervencoes,
      carregando,
      statusSync,
      remotoAtivo,
      ultimaSync,
      adicionarOcorrencia,
      registrarCorte,
      carregarCenario,
      sincronizar,
    ]
  );

  return <OcorrenciasContext.Provider value={valor}>{children}</OcorrenciasContext.Provider>;
}

/**
 * Hook para acessar o contexto de ocorrências e histórico.
 * Lança erro se usado fora do <OcorrenciasProvider>.
 */
export function useOcorrencias(): OcorrenciasContextType {
  const ctx = useContext(OcorrenciasContext);
  if (!ctx) {
    throw new Error("useOcorrencias deve ser usado dentro de <OcorrenciasProvider>");
  }
  return ctx;
}

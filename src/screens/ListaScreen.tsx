import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

import { FilterChip, OcorrenciaCard } from "../components";
import { useOcorrencias } from "../context/OcorrenciasContext";
import { Ocorrencia } from "../interfaces/ocorrencia";
import { CORES, GRADIENTE_HEADER, GRADIENTE_PRIMARIO, SOMBRA_CARD, SOMBRA_FAB } from "../utils/tema";
import { parseKm, parseNumero } from "../utils/estatisticas";

type FiltroLista = "urgente" | "perto" | "km" | null;

type ListaScreenProps = {
  onVerDetalhe: (ocorrencia: Ocorrencia) => void;
  onNovaCadastro: () => void;
};

export default function ListaScreen({
  onVerDetalhe,
  onNovaCadastro,
}: ListaScreenProps) {
  const { ocorrencias, carregando } = useOcorrencias();
  const [filtro, setFiltro] = useState<FiltroLista>(null);

  function alternarFiltro(novo: FiltroLista) {
    setFiltro((atual) => (atual === novo ? null : novo));
  }

  const ocorrenciasExibidas = useMemo(() => {
    let lista = ocorrencias;

    if (filtro === "urgente") {
      lista = lista.filter((o) => o.risco === "alto");
    }

    if (filtro === "perto") {
      lista = [...lista].sort(
        (a, b) => parseNumero(a.distancia) - parseNumero(b.distancia)
      );
    }

    if (filtro === "km") {
      lista = [...lista].sort((a, b) => parseKm(a.local) - parseKm(b.local));
    }

    return lista;
  }, [ocorrencias, filtro]);

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={CORES.primary} />
        <Text style={styles.carregandoTexto}>Carregando ocorrências...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Header em gradiente ── */}
        <LinearGradient
          colors={GRADIENTE_HEADER}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerTopo}>
            <View style={styles.logoBadge}>
              <Image
                source={require("../../assets/motiva-logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <TouchableOpacity style={styles.sinoBotao} activeOpacity={0.8}>
              <Feather name="bell" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.saudacao}>Olá, Operador</Text>
          <Text style={styles.titulo}>Ocorrências detectadas</Text>
          <View style={styles.subtituloLinha}>
            <MaterialCommunityIcons
              name="robot-outline"
              size={12}
              color="rgba(255,255,255,0.75)"
            />
            <Text style={styles.subtitulo}>
              {ocorrencias.length} área{ocorrencias.length !== 1 ? "s" : ""} mapeada{ocorrencias.length !== 1 ? "s" : ""} pelo drone hoje
            </Text>
          </View>
        </LinearGradient>

        {/* ── Filtros sobrepostos ── */}
        <View style={styles.filtrosWrap}>
          <View style={[styles.filtrosCard, SOMBRA_CARD]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 8 }}
            >
              <FilterChip
                icon="filter"
                label="Urgente"
                active={filtro === "urgente"}
                onPress={() => alternarFiltro("urgente")}
              />
              <FilterChip
                icon="map-pin"
                label="Perto de Mim"
                active={filtro === "perto"}
                onPress={() => alternarFiltro("perto")}
              />
              <FilterChip
                icon="maximize-2"
                label="Por KM"
                active={filtro === "km"}
                onPress={() => alternarFiltro("km")}
              />
            </ScrollView>
          </View>
        </View>

        {/* ── Lista de ocorrências ── */}
        <View style={styles.lista}>
          {ocorrencias.length === 0 ? (
            <View style={styles.vazio}>
              <Text style={styles.vazioIcone}>✅</Text>
              <Text style={styles.vazioTexto}>
                Nenhuma ocorrência registrada.
              </Text>
              <Text style={styles.vazioSub}>
                Cadastre a primeira usando o botão abaixo.
              </Text>
            </View>
          ) : ocorrenciasExibidas.length === 0 ? (
            <View style={styles.vazio}>
              <Text style={styles.vazioIcone}>🔎</Text>
              <Text style={styles.vazioTexto}>
                Nenhuma ocorrência urgente no momento.
              </Text>
              <Text style={styles.vazioSub}>
                Toque novamente em "Urgente" para ver todos os trechos.
              </Text>
            </View>
          ) : (
            ocorrenciasExibidas.map((ocorrencia) => (
              <OcorrenciaCard
                key={ocorrencia.id}
                ocorrencia={ocorrencia}
                onPress={onVerDetalhe}
              />
            ))
          )}
        </View>

        {/* Espaço para o FAB não sobrepor o último card */}
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        onPress={onNovaCadastro}
        activeOpacity={0.85}
        style={[styles.fab, SOMBRA_FAB]}
      >
        <LinearGradient
          colors={GRADIENTE_PRIMARIO}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradiente}
        >
          <Feather name="plus" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CORES.background,
  },
  scroll: {
    paddingBottom: 0,
  },
  centro: {
    flex: 1,
    backgroundColor: CORES.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  carregandoTexto: {
    color: CORES.mutedForeground,
    fontSize: 14,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 36,
  },
  headerTopo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoBadge: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logo: {
    width: 76,
    height: 22,
  },
  sinoBotao: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  saudacao: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 20,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 4,
  },
  subtituloLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  subtitulo: {
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
  },

  filtrosWrap: {
    paddingHorizontal: 20,
    marginTop: -18,
  },
  filtrosCard: {
    backgroundColor: CORES.card,
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
  },

  lista: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  vazio: {
    alignItems: "center",
    marginTop: 60,
    gap: 12,
  },
  vazioIcone: {
    fontSize: 56,
  },
  vazioTexto: {
    fontSize: 16,
    fontWeight: "700",
    color: CORES.foreground,
  },
  vazioSub: {
    fontSize: 13,
    color: CORES.mutedForeground,
    textAlign: "center",
  },

  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  fabGradiente: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});

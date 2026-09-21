import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

import { Ocorrencia } from "../interfaces/ocorrencia";
import { CORES, RISCO_ESTILO, SOMBRA_CARD } from "../utils/tema";

type OcorrenciaCardProps = {
  ocorrencia: Ocorrencia;
  onPress: (ocorrencia: Ocorrencia) => void;
};

export default function OcorrenciaCard({
  ocorrencia,
  onPress,
}: OcorrenciaCardProps) {
  const estilo = RISCO_ESTILO[ocorrencia.risco];

  return (
    <TouchableOpacity
      style={[styles.card, SOMBRA_CARD]}
      onPress={() => onPress(ocorrencia)}
      activeOpacity={0.85}
    >
      {/* Cabeçalho: miniatura (se houver) + título + badge de risco */}
      <View style={styles.header}>
        {ocorrencia.fotoUri && (
          <Image source={{ uri: ocorrencia.fotoUri }} style={styles.miniatura} />
        )}
        <View style={styles.headerTextos}>
          <Text style={styles.titulo}>Trecho {ocorrencia.local}</Text>
          <View style={[styles.badge, { backgroundColor: estilo.bg }]}>
            <Text style={[styles.badgeTexto, { color: estilo.texto }]}>
              {estilo.label}
            </Text>
          </View>
        </View>
      </View>

      {/* Distância */}
      <View style={styles.linhaDistancia}>
        <Feather name="map-pin" size={12} color={CORES.mutedForeground} />
        <Text style={styles.distanciaTexto}>
          {ocorrencia.distancia} de você
        </Text>
      </View>

      {/* Divisor */}
      <View style={styles.divisor} />

      {/* Rodapé: ícone IA + previsão de altura */}
      <View style={styles.rodape}>
        <View style={styles.botIcone}>
          <MaterialCommunityIcons
            name="robot-outline"
            size={13}
            color={CORES.accentForeground}
          />
        </View>
        <Text style={styles.rodapeTexto}>
          Previsão: {ocorrencia.alturaGrama} de altura
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CORES.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  miniatura: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: CORES.muted,
  },
  headerTextos: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  titulo: {
    fontSize: 15,
    fontWeight: "600",
    color: CORES.foreground,
    flex: 1,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeTexto: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  linhaDistancia: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  distanciaTexto: {
    fontSize: 12,
    color: CORES.mutedForeground,
  },
  divisor: {
    height: 1,
    backgroundColor: CORES.border,
    marginTop: 12,
    marginBottom: 12,
  },
  rodape: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  botIcone: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: CORES.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  rodapeTexto: {
    fontSize: 12,
    color: CORES.mutedForeground,
  },
});

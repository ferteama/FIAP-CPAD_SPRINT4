import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { CORES, SOMBRA_CARD } from "../utils/tema";

type EstatisticaCardProps = {
  valor: string | number;
  label: string;
  corValor?: string;
  sublabel?: string;
};

/** Card compacto de métrica única, usado nas grades de estatísticas do Dashboard. */
export default function EstatisticaCard({
  valor,
  label,
  corValor,
  sublabel,
}: EstatisticaCardProps) {
  return (
    <View style={[styles.card, SOMBRA_CARD]}>
      <Text style={[styles.valor, corValor ? { color: corValor } : null]}>
        {valor}
      </Text>
      <Text style={styles.label}>{label}</Text>
      {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: CORES.card,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 2,
  },
  valor: {
    fontSize: 20,
    fontWeight: "800",
    color: CORES.foreground,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: CORES.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
    marginTop: 2,
  },
  sublabel: {
    fontSize: 9,
    color: CORES.mutedForeground,
    opacity: 0.8,
    textAlign: "center",
  },
});

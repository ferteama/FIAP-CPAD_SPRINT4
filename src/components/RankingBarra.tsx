import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { CORES, COR_RISCO } from "../utils/tema";
import { NivelRisco } from "../types/nivelRisco";

type RankingBarraProps = {
  local: string;
  alturaCm: number;
  risco: NivelRisco;
  /** Maior altura entre todos os trechos exibidos — define a escala das barras. */
  maiorAltura: number;
};

/**
 * Uma linha do ranking "Altura por Trecho" no Dashboard: nome do trecho +
 * barra horizontal proporcional à altura + valor em cm.
 * Implementado só com Views (sem lib de gráfico) para não adicionar
 * dependência nova no projeto.
 */
export default function RankingBarra({
  local,
  alturaCm,
  risco,
  maiorAltura,
}: RankingBarraProps) {
  const larguraPercentual =
    maiorAltura > 0 ? Math.max(6, (alturaCm / maiorAltura) * 100) : 6;

  return (
    <View style={styles.linha}>
      <Text style={styles.local} numberOfLines={1}>
        {local}
      </Text>
      <View style={styles.trilho}>
        <View
          style={[
            styles.barra,
            {
              width: `${larguraPercentual}%`,
              backgroundColor: COR_RISCO[risco],
            },
          ]}
        />
      </View>
      <Text style={styles.valor}>{alturaCm}cm</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  local: {
    width: 72,
    fontSize: 11,
    color: CORES.mutedForeground,
    fontWeight: "600",
  },
  trilho: {
    flex: 1,
    height: 10,
    borderRadius: 6,
    backgroundColor: CORES.muted,
    overflow: "hidden",
  },
  barra: {
    height: "100%",
    borderRadius: 6,
  },
  valor: {
    width: 44,
    fontSize: 11,
    fontWeight: "800",
    color: CORES.foreground,
    textAlign: "right",
  },
});

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { CORES } from "../utils/tema";

export type AbaNav = "dashboard" | "lista" | "cadastro" | "relatorio";

type BottomNavProps = {
  abaAtiva: AbaNav;
  onSelecionar: (aba: AbaNav) => void;
};

const ABAS: { chave: AbaNav; label: string; icone: keyof typeof Feather.glyphMap }[] = [
  { chave: "dashboard", label: "Início", icone: "home" },
  { chave: "lista", label: "Trechos", icone: "list" },
  { chave: "cadastro", label: "Vistoria", icone: "plus-circle" },
  { chave: "relatorio", label: "Relatório", icone: "bar-chart-2" },
];

/** Navegação inferior fixa, compartilhada entre Dashboard, Trechos, Vistoria e Relatório. */
export default function BottomNav({ abaAtiva, onSelecionar }: BottomNavProps) {
  return (
    <View style={styles.container}>
      {ABAS.map((aba) => {
        const ativa = aba.chave === abaAtiva;
        return (
          <TouchableOpacity
            key={aba.chave}
            style={styles.item}
            onPress={() => onSelecionar(aba.chave)}
            activeOpacity={0.7}
          >
            <Feather
              name={aba.icone}
              size={20}
              color={ativa ? CORES.primary : CORES.mutedForeground}
            />
            <Text style={[styles.label, ativa && styles.labelAtivo]}>
              {aba.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: CORES.card,
    borderTopWidth: 1,
    borderTopColor: CORES.border,
    paddingTop: 8,
    paddingBottom: 10,
  },
  item: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: CORES.mutedForeground,
  },
  labelAtivo: {
    color: CORES.primary,
  },
});

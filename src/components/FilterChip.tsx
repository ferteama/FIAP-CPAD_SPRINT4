import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

import { CORES } from "../utils/tema";

type FilterChipProps = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  active?: boolean;
  onPress?: () => void;
};

export default function FilterChip({
  icon,
  label,
  active,
  onPress,
}: FilterChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipAtivo]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Feather
        name={icon}
        size={12}
        color={active ? "#FFFFFF" : CORES.mutedForeground}
      />
      <Text style={[styles.texto, active && styles.textoAtivo]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: CORES.muted,
    marginRight: 8,
  },
  chipAtivo: {
    backgroundColor: CORES.primary,
  },
  texto: {
    fontSize: 12,
    fontWeight: "600",
    color: CORES.mutedForeground,
  },
  textoAtivo: {
    color: "#FFFFFF",
  },
});

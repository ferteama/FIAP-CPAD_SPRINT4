import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { useOcorrencias } from "../context/OcorrenciasContext";
import { CORES, RISCO_ESTILO, SOMBRA_CARD } from "../utils/tema";
import {
  LIMITE_REGULATORIO_CM,
  alturaMediaCm,
  contarPorRisco,
  indiceConformidade,
  parseNumero,
  vistoriasNoMes,
} from "../utils/estatisticas";

/**
 * Relatório consolidado do monitoramento — pensado para ser lido/exportado
 * pelo operador ao final do turno. Reaproveita as mesmas funções de
 * estatísticas do Dashboard, mas em formato de lista/tabela.
 */
export default function RelatorioScreen() {
  const { ocorrencias, carregando } = useOcorrencias();

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={CORES.primary} />
        <Text style={styles.carregandoTexto}>Gerando relatório...</Text>
      </View>
    );
  }

  const total = ocorrencias.length;
  const contagem = contarPorRisco(ocorrencias);
  const conformidade = indiceConformidade(ocorrencias);
  const alturaMedia = alturaMediaCm(ocorrencias);
  const vistoriasMes = vistoriasNoMes(ocorrencias);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerSubtitulo}>Regional Oeste · BR-101</Text>
        <Text style={styles.headerTitulo}>Relatório de Monitoramento</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {total === 0 ? (
          <View style={[styles.card, SOMBRA_CARD, styles.vazio]}>
            <Feather name="file-text" size={28} color={CORES.mutedForeground} />
            <Text style={styles.vazioTexto}>
              Nenhum dado para relatar ainda. Registre vistorias para gerar o
              relatório.
            </Text>
          </View>
        ) : (
          <>
            <View style={[styles.card, SOMBRA_CARD]}>
              <Text style={styles.cardTitulo}>Resumo Geral</Text>
              <LinhaResumo label="Trechos monitorados" valor={`${total}`} />
              <LinhaResumo label="Vistorias no mês" valor={`${vistoriasMes}`} />
              <LinhaResumo label="Altura média" valor={`${alturaMedia}cm`} />
              <LinhaResumo
                label="Limite regulatório"
                valor={`${LIMITE_REGULATORIO_CM}cm`}
              />
              <LinhaResumo
                label="Índice de conformidade"
                valor={`${conformidade}%`}
                destaque={
                  conformidade >= 70
                    ? CORES.success
                    : conformidade >= 40
                    ? CORES.warning
                    : CORES.destructive
                }
              />
            </View>

            <View style={[styles.card, SOMBRA_CARD]}>
              <Text style={styles.cardTitulo}>Trechos por Classificação</Text>
              {(["alto", "medio", "baixo"] as const).map((nivel) => (
                <LinhaResumo
                  key={nivel}
                  label={RISCO_ESTILO[nivel].label}
                  valor={`${contagem[nivel]}`}
                  destaque={RISCO_ESTILO[nivel].bg}
                />
              ))}
            </View>

            <View style={[styles.card, SOMBRA_CARD]}>
              <Text style={styles.cardTitulo}>Detalhamento por Trecho</Text>
              {ocorrencias.map((o) => (
                <View key={o.id} style={styles.linhaTabela}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tabelaLocal}>{o.local}</Text>
                    <Text style={styles.tabelaData}>{o.data}</Text>
                  </View>
                  <Text style={styles.tabelaAltura}>{o.alturaGrama}</Text>
                  <View
                    style={[
                      styles.tabelaBadge,
                      { backgroundColor: RISCO_ESTILO[o.risco].bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabelaBadgeTexto,
                        { color: RISCO_ESTILO[o.risco].texto },
                      ]}
                    >
                      {RISCO_ESTILO[o.risco].label}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <Text style={styles.notaExportacao}>
              Exportação em PDF/CSV ainda não implementada nesta versão —
              planejada como próximo passo do produto.
            </Text>
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function LinhaResumo({
  label,
  valor,
  destaque,
}: {
  label: string;
  valor: string;
  destaque?: string;
}) {
  return (
    <View style={styles.linhaResumo}>
      <Text style={styles.linhaResumoLabel}>{label}</Text>
      <Text
        style={[
          styles.linhaResumoValor,
          destaque ? { color: destaque } : null,
        ]}
      >
        {valor}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CORES.background,
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
    backgroundColor: CORES.secondary,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 18,
  },
  headerSubtitulo: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
  },
  headerTitulo: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 2,
  },

  scroll: {
    padding: 20,
  },

  card: {
    backgroundColor: CORES.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  cardTitulo: {
    fontSize: 12,
    fontWeight: "800",
    color: CORES.foreground,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  vazio: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 32,
  },
  vazioTexto: {
    fontSize: 13,
    color: CORES.mutedForeground,
    textAlign: "center",
  },

  linhaResumo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: CORES.border,
  },
  linhaResumoLabel: {
    fontSize: 13,
    color: CORES.mutedForeground,
  },
  linhaResumoValor: {
    fontSize: 14,
    fontWeight: "800",
    color: CORES.foreground,
  },

  linhaTabela: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: CORES.border,
  },
  tabelaLocal: {
    fontSize: 13,
    fontWeight: "700",
    color: CORES.foreground,
  },
  tabelaData: {
    fontSize: 10,
    color: CORES.mutedForeground,
    marginTop: 1,
  },
  tabelaAltura: {
    fontSize: 12,
    fontWeight: "700",
    color: CORES.foreground,
    width: 44,
    textAlign: "right",
  },
  tabelaBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tabelaBadgeTexto: {
    fontSize: 9,
    fontWeight: "800",
  },

  notaExportacao: {
    fontSize: 11,
    color: CORES.mutedForeground,
    textAlign: "center",
    opacity: 0.8,
    marginTop: 4,
  },
});

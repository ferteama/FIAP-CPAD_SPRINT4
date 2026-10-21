import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { useOcorrencias } from "../context/OcorrenciasContext";
import { useAuth } from "../context/AuthContext";
import {
  exportarCsvIntervencoes,
  exportarCsvOcorrencias,
  exportarPdf,
} from "../services/exportacaoService";
import { diasEntre } from "../utils/datas";
import { CORES, RISCO_ESTILO, SOMBRA_CARD } from "../utils/tema";
import {
  LIMITE_REGULATORIO_CM,
  alturaMediaCm,
  contarPorRisco,
  indiceConformidade,
  intervencoesNoMes,
  parseNumero,
  tempoMedioAtendimentoDias,
  trechosReincidentes,
  vistoriasNoMes,
} from "../utils/estatisticas";

/**
 * Relatório consolidado do monitoramento — pensado para ser lido/exportado
 * pelo operador ao final do turno. Reaproveita as mesmas funções de
 * estatísticas do Dashboard, mas em formato de lista/tabela.
 */
export default function RelatorioScreen() {
  const { ocorrencias, intervencoes, carregando } = useOcorrencias();
  const { usuario } = useAuth();
  const [exportando, setExportando] = useState<null | "pdf" | "csv-trechos" | "csv-historico">(null);

  async function exportar(tipo: "pdf" | "csv-trechos" | "csv-historico") {
    setExportando(tipo);
    try {
      if (tipo === "pdf") await exportarPdf(ocorrencias, intervencoes, usuario?.nome ?? "Operador");
      else if (tipo === "csv-trechos") await exportarCsvOcorrencias(ocorrencias);
      else await exportarCsvIntervencoes(intervencoes);
    } catch (e: any) {
      Alert.alert("Não foi possível exportar", e?.message ?? "Tente novamente.");
    } finally {
      setExportando(null);
    }
  }

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
  const rocadasMes = intervencoesNoMes(intervencoes);
  const tma = tempoMedioAtendimentoDias(intervencoes);
  const reincidentes = trechosReincidentes(intervencoes);

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
        {total === 0 && intervencoes.length === 0 ? (
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
              <LinhaResumo label="Roçadas executadas no mês" valor={`${rocadasMes}`} />
              <LinhaResumo
                label="Tempo médio de atendimento"
                valor={tma === null ? "—" : `${tma} dia(s)`}
              />
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

            <View style={[styles.card, SOMBRA_CARD]}>
              <Text style={styles.cardTitulo}>Histórico de Intervenções</Text>
              {intervencoes.length === 0 ? (
                <Text style={styles.vazioTexto}>Nenhuma intervenção registrada ainda.</Text>
              ) : (
                <>
                  {reincidentes.length > 0 && (
                    <Text style={styles.reincidencia}>
                      Reincidência: {reincidentes.slice(0, 3).map((r) => `${r.local} (${r.total}x)`).join(", ")}
                    </Text>
                  )}
                  {intervencoes.slice(0, 8).map((i) => {
                    const dias = diasEntre(i.dataDeteccao, i.dataCorte);
                    return (
                      <View key={i.id} style={styles.linhaTabela}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.tabelaLocal}>{i.local}</Text>
                          <Text style={styles.tabelaData}>
                            {i.dataCorte} · {i.responsavel}
                          </Text>
                        </View>
                        <Text style={styles.tabelaAltura}>
                          {dias !== null ? `${dias} d` : "—"}
                        </Text>
                      </View>
                    );
                  })}
                  {intervencoes.length > 8 && (
                    <Text style={styles.notaExportacao}>
                      + {intervencoes.length - 8} no histórico completo (aba Histórico ou exportação).
                    </Text>
                  )}
                </>
              )}
            </View>

            <View style={[styles.card, SOMBRA_CARD]}>
              <Text style={styles.cardTitulo}>Exportar</Text>
              <BotaoExportar
                icone="file-text"
                texto="Relatório em PDF"
                carregando={exportando === "pdf"}
                desabilitado={exportando !== null}
                aoPressionar={() => exportar("pdf")}
              />
              <BotaoExportar
                icone="download"
                texto="CSV — trechos monitorados"
                carregando={exportando === "csv-trechos"}
                desabilitado={exportando !== null || total === 0}
                aoPressionar={() => exportar("csv-trechos")}
              />
              <BotaoExportar
                icone="download"
                texto="CSV — histórico de intervenções"
                carregando={exportando === "csv-historico"}
                desabilitado={exportando !== null || intervencoes.length === 0}
                aoPressionar={() => exportar("csv-historico")}
              />
            </View>
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function BotaoExportar({
  icone,
  texto,
  carregando,
  desabilitado,
  aoPressionar,
}: {
  icone: keyof typeof Feather.glyphMap;
  texto: string;
  carregando: boolean;
  desabilitado: boolean;
  aoPressionar: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.btnExportar, desabilitado && { opacity: 0.45 }]}
      onPress={aoPressionar}
      disabled={desabilitado}
      activeOpacity={0.8}
      accessibilityLabel={texto}
    >
      {carregando ? (
        <ActivityIndicator size="small" color={CORES.primary} />
      ) : (
        <Feather name={icone} size={16} color={CORES.primary} />
      )}
      <Text style={styles.btnExportarTexto}>{texto}</Text>
    </TouchableOpacity>
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

  reincidencia: { fontSize: 12, color: CORES.warningForeground, backgroundColor: CORES.warning + "33", borderRadius: 10, padding: 10, marginBottom: 6 },
  btnExportar: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, backgroundColor: CORES.accent, marginTop: 8 },
  btnExportarTexto: { fontSize: 13, fontWeight: "700", color: CORES.primary },
  notaExportacao: {
    fontSize: 11,
    color: CORES.mutedForeground,
    textAlign: "center",
    opacity: 0.8,
    marginTop: 4,
  },
});

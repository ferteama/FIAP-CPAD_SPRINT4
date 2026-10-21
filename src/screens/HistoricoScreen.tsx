import React, { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { EstatisticaCard, FilterChip } from "../components";
import { useOcorrencias } from "../context/OcorrenciasContext";
import { CORES, RISCO_ESTILO, SOMBRA_CARD } from "../utils/tema";
import { diasEntre } from "../utils/datas";
import {
  filtrarPorPeriodo,
  intervencoesNoMes,
  tempoMedioAtendimentoDias,
} from "../utils/estatisticas";

type Periodo = 7 | 30 | null;

/**
 * Histórico de intervenções: todas as roçadas já executadas, com quem fez,
 * quando e quanto tempo o trecho esperou. É o registro que o processo manual
 * da Motiva não tinha.
 */
export default function HistoricoScreen() {
  const { intervencoes, carregando } = useOcorrencias();
  const [periodo, setPeriodo] = useState<Periodo>(null);

  const exibidas = useMemo(() => filtrarPorPeriodo(intervencoes, periodo), [intervencoes, periodo]);

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={CORES.primary} />
      </View>
    );
  }

  const tma = tempoMedioAtendimentoDias(intervencoes);

  function alternar(p: Periodo) {
    setPeriodo((atual) => (atual === p ? null : p));
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerSubtitulo}>Regional Oeste · BR-101</Text>
        <Text style={styles.headerTitulo}>Histórico de Intervenções</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.linhaCards}>
          <EstatisticaCard valor={intervencoes.length} label="Roçadas" sublabel="no histórico" />
          <EstatisticaCard valor={intervencoesNoMes(intervencoes)} label="Neste mês" />
          <EstatisticaCard
            valor={tma === null ? "—" : `${tma}d`}
            label="Atendimento"
            sublabel="tempo médio"
          />
        </View>

        <View style={styles.chips}>
          <FilterChip icon="calendar" label="7 dias" active={periodo === 7} onPress={() => alternar(7)} />
          <FilterChip icon="calendar" label="30 dias" active={periodo === 30} onPress={() => alternar(30)} />
        </View>

        {intervencoes.length === 0 ? (
          <View style={[styles.vazio, SOMBRA_CARD]}>
            <Feather name="clock" size={28} color={CORES.mutedForeground} />
            <Text style={styles.vazioTitulo}>Nenhuma intervenção registrada</Text>
            <Text style={styles.vazioTexto}>
              Quando um corte for registrado no detalhe de um trecho, ele aparece aqui.
            </Text>
          </View>
        ) : exibidas.length === 0 ? (
          <View style={[styles.vazio, SOMBRA_CARD]}>
            <Feather name="search" size={28} color={CORES.mutedForeground} />
            <Text style={styles.vazioTitulo}>Nenhuma roçada nesse período</Text>
            <Text style={styles.vazioTexto}>Toque novamente no filtro para ver todo o histórico.</Text>
          </View>
        ) : (
          exibidas.map((i) => {
            const dias = diasEntre(i.dataDeteccao, i.dataCorte);
            return (
              <View key={i.id} style={[styles.card, SOMBRA_CARD]}>
                <View style={styles.cardTopo}>
                  <Text style={styles.cardTitulo}>Trecho {i.local}</Text>
                  <View style={[styles.badge, { backgroundColor: RISCO_ESTILO[i.riscoAntes].bg }]}>
                    <Text style={[styles.badgeTexto, { color: RISCO_ESTILO[i.riscoAntes].texto }]}>
                      {i.alturaAntes} antes
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardLinha}>
                  <Feather name="check-circle" size={12} color={CORES.primary} /> Roçada em {i.dataCorte}
                  {dias !== null ? ` · atendida em ${dias} dia${dias !== 1 ? "s" : ""}` : ""}
                </Text>
                <Text style={styles.cardLinha}>
                  <Feather name="user" size={12} color={CORES.mutedForeground} /> {i.responsavel}
                </Text>
                {i.observacao ? <Text style={styles.cardObs}>“{i.observacao}”</Text> : null}
              </View>
            );
          })
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.background },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: CORES.background },
  header: { backgroundColor: CORES.secondary, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 18 },
  headerSubtitulo: { fontSize: 11, color: "rgba(255,255,255,0.7)" },
  headerTitulo: { fontSize: 18, fontWeight: "800", color: "#FFFFFF", marginTop: 2 },
  scroll: { padding: 20 },
  linhaCards: { flexDirection: "row", gap: 10 },
  chips: { flexDirection: "row", gap: 8, marginTop: 16, marginBottom: 12 },
  card: { backgroundColor: CORES.card, borderRadius: 16, padding: 14, marginBottom: 12, gap: 4 },
  cardTopo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  cardTitulo: { fontSize: 14, fontWeight: "800", color: CORES.foreground },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeTexto: { fontSize: 10, fontWeight: "800" },
  cardLinha: { fontSize: 12, color: CORES.mutedForeground },
  cardObs: { fontSize: 12, color: CORES.foreground, fontStyle: "italic", marginTop: 4 },
  vazio: { backgroundColor: CORES.card, borderRadius: 18, padding: 28, alignItems: "center", gap: 8 },
  vazioTitulo: { fontSize: 14, fontWeight: "800", color: CORES.foreground },
  vazioTexto: { fontSize: 12, color: CORES.mutedForeground, textAlign: "center", lineHeight: 18 },
});

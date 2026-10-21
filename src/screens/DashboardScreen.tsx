import React from "react";
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

import { EstatisticaCard, OcorrenciaCard, RankingBarra } from "../components";
import { useOcorrencias } from "../context/OcorrenciasContext";
import { useAuth } from "../context/AuthContext";
import { Ocorrencia } from "../interfaces/ocorrencia";
import {
  CORES,
  GRADIENTE_HEADER,
  GRADIENTE_PRIMARIO,
  RISCO_ESTILO,
  SOMBRA_CARD,
  SOMBRA_FAB,
} from "../utils/tema";
import {
  LIMITE_REGULATORIO_CM,
  alturaMediaCm,
  contarPorRisco,
  indiceConformidade,
  intervencoesNoMes,
  ordenarPorAltura,
  tempoMedioAtendimentoDias,
  trechosReincidentes,
  parseNumero,
  trechosPrioritarios,
  vistoriasNoMes,
} from "../utils/estatisticas";

type DashboardScreenProps = {
  onNovaVistoria: () => void;
  onVerTrechos: () => void;
  onVerDetalhe: (ocorrencia: Ocorrencia) => void;
  onAbrirPerfil: () => void;
};

function saudacaoPorHorario(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export default function DashboardScreen({
  onNovaVistoria,
  onVerTrechos,
  onVerDetalhe,
  onAbrirPerfil,
}: DashboardScreenProps) {
  const { ocorrencias, intervencoes, carregando, statusSync } = useOcorrencias();
  const { usuario } = useAuth();

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={CORES.primary} />
        <Text style={styles.carregandoTexto}>Carregando painel...</Text>
      </View>
    );
  }

  const totalTrechos = ocorrencias.length;
  const contagem = contarPorRisco(ocorrencias);
  const alturaMedia = alturaMediaCm(ocorrencias);
  const conformidade = indiceConformidade(ocorrencias);
  const prioritarios = trechosPrioritarios(ocorrencias, 5);
  const ranking = ordenarPorAltura(ocorrencias).slice(0, 8);
  const maiorAltura = ranking.length > 0 ? parseNumero(ranking[0].alturaGrama) : 0;
  const vistoriasMes = vistoriasNoMes(ocorrencias);
  const rocadasMes = intervencoesNoMes(intervencoes);
  const tma = tempoMedioAtendimentoDias(intervencoes);
  const reincidentes = trechosReincidentes(intervencoes);
  const primeiroNome = usuario?.nome.split(" ")[0] ?? "Operador";
  const iniciais = (usuario?.nome ?? "O")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");

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
            <TouchableOpacity
              style={styles.sinoBotao}
              activeOpacity={0.8}
              onPress={onAbrirPerfil}
              accessibilityLabel="Abrir perfil"
            >
              <Text style={styles.avatarIniciais}>{iniciais}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.saudacao}>
            {saudacaoPorHorario()}, {primeiroNome} 👋
          </Text>
          <Text style={styles.titulo}>Painel de Monitoramento</Text>
          <View style={styles.subtituloLinha}>
            <MaterialCommunityIcons
              name="robot-outline"
              size={12}
              color="rgba(255,255,255,0.75)"
            />
            <Text style={styles.subtitulo}>
              {totalTrechos} trecho{totalTrechos !== 1 ? "s" : ""} monitorado
              {totalTrechos !== 1 ? "s" : ""} · BR-101
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.conteudo}>
          {(statusSync === "erro" || statusSync === "pendente") && (
            <TouchableOpacity style={styles.bannerSync} onPress={onAbrirPerfil} activeOpacity={0.8}>
              <Feather name="cloud-off" size={14} color={CORES.warningForeground} />
              <Text style={styles.bannerSyncTexto}>
                {statusSync === "erro"
                  ? "Não foi possível sincronizar com o Firebase. Seus dados estão salvos neste aparelho."
                  : "Há alterações aguardando envio ao Firebase."}
              </Text>
            </TouchableOpacity>
          )}
          {totalTrechos === 0 ? (
            // ── Estado vazio: nenhuma ocorrência cadastrada ainda ──
            <View style={[styles.vazioCard, SOMBRA_CARD]}>
              <Text style={styles.vazioIcone}>🛰️</Text>
              <Text style={styles.vazioTitulo}>Nenhum trecho monitorado</Text>
              <Text style={styles.vazioTexto}>
                Registre a primeira vistoria para começar a ver as métricas do
                painel.
              </Text>
              <TouchableOpacity
                onPress={onNovaVistoria}
                activeOpacity={0.85}
                style={{ borderRadius: 14, marginTop: 6 }}
              >
                <LinearGradient
                  colors={GRADIENTE_PRIMARIO}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.vazioBotao}
                >
                  <Feather name="plus" size={16} color="#FFFFFF" />
                  <Text style={styles.vazioBotaoTexto}>Nova Vistoria</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* ── Distribuição de status ── */}
              <Text style={styles.secaoTitulo}>Distribuição de Status</Text>
              <View style={styles.linhaCards}>
                <EstatisticaCard
                  valor={contagem.alto}
                  label={RISCO_ESTILO.alto.label}
                  corValor={CORES.destructive}
                />
                <EstatisticaCard
                  valor={contagem.medio}
                  label={RISCO_ESTILO.medio.label}
                  corValor={CORES.warning}
                />
                <EstatisticaCard
                  valor={contagem.baixo}
                  label={RISCO_ESTILO.baixo.label}
                  corValor={CORES.success}
                />
              </View>

              <View style={[styles.linhaCards, { marginTop: 10 }]}>
                <EstatisticaCard
                  valor={vistoriasMes}
                  label="Vistorias/mês"
                  sublabel="registradas neste mês"
                />
                <EstatisticaCard
                  valor={`${alturaMedia}cm`}
                  label="Altura média"
                  sublabel="todos os trechos"
                />
                <EstatisticaCard
                  valor={contagem.alto}
                  label="Urgentes"
                  corValor={CORES.destructive}
                  sublabel="aguardam roçada"
                />
              </View>

              {/* ── Histórico de intervenções (resumo) ── */}
              <Text style={[styles.secaoTitulo, { marginTop: 18 }]}>Intervenções</Text>
              <View style={styles.linhaCards}>
                <EstatisticaCard valor={rocadasMes} label="Roçadas/mês" sublabel="executadas neste mês" />
                <EstatisticaCard
                  valor={tma === null ? "—" : `${tma}d`}
                  label="Atendimento"
                  sublabel="tempo médio até o corte"
                />
                <EstatisticaCard
                  valor={reincidentes.length}
                  label="Reincidentes"
                  sublabel="trechos com 2+ roçadas"
                />
              </View>

              {/* ── Ranking de altura por trecho ── */}
              <View style={[styles.blocoCard, SOMBRA_CARD]}>
                <Text style={styles.blocoTitulo}>
                  Altura por Trecho (cm)
                </Text>
                <Text style={styles.blocoSubtitulo}>
                  Maior para menor · limite regulatório: {LIMITE_REGULATORIO_CM}
                  cm
                </Text>
                <View style={{ marginTop: 14 }}>
                  {ranking.map((o) => (
                    <RankingBarra
                      key={o.id}
                      local={o.local}
                      alturaCm={parseNumero(o.alturaGrama)}
                      risco={o.risco}
                      maiorAltura={maiorAltura}
                    />
                  ))}
                </View>
              </View>

              {/* ── Prioridade máxima ── */}
              {prioritarios.length > 0 && (
                <View style={styles.secaoHeader}>
                  <Text style={styles.secaoTitulo}>Prioridade Máxima</Text>
                  <TouchableOpacity onPress={onVerTrechos} activeOpacity={0.7}>
                    <Text style={styles.verTodos}>Ver todos →</Text>
                  </TouchableOpacity>
                </View>
              )}
              {prioritarios.map((o) => (
                <OcorrenciaCard key={o.id} ocorrencia={o} onPress={onVerDetalhe} />
              ))}

              {/* ── Índice de conformidade ── */}
              <View style={[styles.blocoCard, SOMBRA_CARD, styles.conformidadeCard]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.blocoTitulo}>Índice de Conformidade</Text>
                  <Text style={styles.blocoSubtitulo}>
                    {
                      ocorrencias.filter(
                        (o) => parseNumero(o.alturaGrama) <= LIMITE_REGULATORIO_CM
                      ).length
                    }{" "}
                    de {totalTrechos} trechos dentro do padrão regulatório
                  </Text>
                </View>
                <Text
                  style={[
                    styles.conformidadeValor,
                    {
                      color:
                        conformidade >= 70
                          ? CORES.success
                          : conformidade >= 40
                          ? CORES.warning
                          : CORES.destructive,
                    },
                  ]}
                >
                  {conformidade}%
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── FAB: Nova Vistoria ── */}
      <TouchableOpacity
        onPress={onNovaVistoria}
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
  avatarIniciais: { color: "#FFFFFF", fontWeight: "800", fontSize: 13 },
  bannerSync: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: CORES.warning + "33",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  bannerSyncTexto: { flex: 1, fontSize: 12, color: CORES.warningForeground, lineHeight: 17 },
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

  conteudo: {
    paddingHorizontal: 20,
    paddingTop: 22,
    marginTop: -18,
    backgroundColor: CORES.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  vazioCard: {
    backgroundColor: CORES.card,
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    gap: 6,
  },
  vazioIcone: {
    fontSize: 40,
    marginBottom: 4,
  },
  vazioTitulo: {
    fontSize: 15,
    fontWeight: "800",
    color: CORES.foreground,
  },
  vazioTexto: {
    fontSize: 12,
    color: CORES.mutedForeground,
    textAlign: "center",
    lineHeight: 18,
  },
  vazioBotao: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  vazioBotaoTexto: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },

  secaoTitulo: {
    fontSize: 13,
    fontWeight: "800",
    color: CORES.foreground,
    marginBottom: 10,
    marginTop: 4,
  },
  secaoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 10,
  },
  verTodos: {
    fontSize: 12,
    fontWeight: "700",
    color: CORES.primary,
  },

  linhaCards: {
    flexDirection: "row",
    gap: 10,
  },

  blocoCard: {
    backgroundColor: CORES.card,
    borderRadius: 18,
    padding: 16,
    marginTop: 18,
  },
  blocoTitulo: {
    fontSize: 13,
    fontWeight: "800",
    color: CORES.foreground,
  },
  blocoSubtitulo: {
    fontSize: 11,
    color: CORES.mutedForeground,
    marginTop: 2,
  },

  conformidadeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  conformidadeValor: {
    fontSize: 30,
    fontWeight: "800",
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

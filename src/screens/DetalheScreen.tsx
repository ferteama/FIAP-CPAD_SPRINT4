import React, { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

import { useOcorrencias } from "../context/OcorrenciasContext";
import { Ocorrencia } from "../interfaces/ocorrencia";
import { CORES, GRADIENTE_PRIMARIO, SOMBRA_CARD, SOMBRA_FAB } from "../utils/tema";

type DetalheScreenProps = {
  ocorrencia: Ocorrencia;
  onVoltar: () => void;
};

export default function DetalheScreen({
  ocorrencia,
  onVoltar,
}: DetalheScreenProps) {
  const { removerOcorrencia } = useOcorrencias();
  const [registrando, setRegistrando] = useState(false);
  const [modalConfirmacaoVisivel, setModalConfirmacaoVisivel] = useState(false);
  const [modalSucessoVisivel, setModalSucessoVisivel] = useState(false);

  const eCritico = ocorrencia.risco === "alto";

  // Código de setor estilo "42N" — número do KM + inicial da direção
  const numeroKm = ocorrencia.local.match(/\d+/)?.[0] ?? "0";
  const direcao = ocorrencia.local.includes("Norte") ? "N" : "S";
  const codigoSetor = `${numeroKm}${direcao}`;

  /**
   * Confirma a remoção: tira a ocorrência do estado global
   * (useOcorrencias) e, por consequência, do AsyncStorage.
   * Em seguida exibe uma confirmação visual e volta à lista.
   */
  async function confirmarCorte() {
    setRegistrando(true);
    try {
      await removerOcorrencia(ocorrencia.id);
      setModalConfirmacaoVisivel(false);
      setModalSucessoVisivel(true);
    } finally {
      setRegistrando(false);
    }
  }

  function fecharSucessoEVoltar() {
    setModalSucessoVisivel(false);
    onVoltar();
  }

  return (
    <View style={styles.container}>
      {/* ── Header navy ── */}
      <View style={styles.header}>
        <View style={styles.headerLinha}>
          <TouchableOpacity
            style={styles.btnVoltar}
            onPress={onVoltar}
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={16} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerSubtitulo}>Setor #{codigoSetor}</Text>
            <Text style={styles.headerTitulo}>Detalhes do Setor</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Imagem do drone com overlay ── */}
        <View style={styles.droneWrap}>
          <Image
            source={
              ocorrencia.fotoUri
                ? { uri: ocorrencia.fotoUri }
                : require("../../assets/drone-grass.jpg")
            }
            style={styles.droneImagem}
            resizeMode="cover"
          />

          {/* Overlay vermelho — só em risco alto, simula máscara OpenCV */}
          {eCritico && <View style={styles.droneOverlay} pointerEvents="none" />}

          {/* Badge LIVE ou FOTO ENVIADA */}
          <View style={styles.liveBadge}>
            <View
              style={[
                styles.liveDot,
                { backgroundColor: ocorrencia.fotoUri ? CORES.success : CORES.destructive },
              ]}
            />
            <Text style={styles.liveTexto}>
              {ocorrencia.fotoUri ? "FOTO • Registro do Operador" : "LIVE • Drone DJI-04"}
            </Text>
          </View>

          {/* Badge área crítica */}
          {eCritico && (
            <View style={styles.areaCriticaBadge}>
              <Text style={styles.areaCriticaTexto}>ÁREA CRÍTICA · OpenCV</Text>
            </View>
          )}
        </View>

        {/* ── Localização ── */}
        <View style={styles.localLinha}>
          <Feather name="map-pin" size={14} color={CORES.primary} />
          <Text style={styles.localTexto}>
            Trecho {ocorrencia.local} · BR-101
          </Text>
        </View>

        {/* ── Predição XGBoost ── */}
        <View style={[styles.predicaoCard, SOMBRA_CARD]}>
          <View style={styles.predicaoCabecalho}>
            <MaterialCommunityIcons name="robot-outline" size={14} color={CORES.primary} />
            <Text style={styles.predicaoTitulo}>Predição XGBoost</Text>
          </View>

          <View style={styles.metricasGrid}>
            <Metrica
              icon={<MaterialCommunityIcons name="ruler" size={16} color={CORES.accentForeground} />}
              label="Altura atual"
              valor={ocorrencia.alturaGrama}
            />
            <Metrica
              icon={<Feather name="calendar" size={16} color={CORES.accentForeground} />}
              label="Corte em"
              valor={ocorrencia.previsaoCorte}
            />
            <Metrica
              icon={<Feather name="sun" size={16} color={CORES.accentForeground} />}
              label="Clima"
              valor={ocorrencia.clima}
            />
          </View>
        </View>

        {/* ── Recomendação IA ── */}
        <View style={styles.recomendacaoCard}>
          <Text style={styles.recomendacaoTitulo}>Recomendação IA</Text>
          <Text style={styles.recomendacaoTexto}>{ocorrencia.descricao}</Text>
        </View>
      </ScrollView>

      {/* ── Botão registrar corte (fixo no rodapé) ── */}
      <View style={styles.rodapeFixo}>
        <TouchableOpacity
          onPress={() => setModalConfirmacaoVisivel(true)}
          disabled={registrando}
          activeOpacity={0.85}
          style={[{ borderRadius: 18 }, SOMBRA_FAB, registrando && { opacity: 0.6 }]}
        >
          <LinearGradient
            colors={GRADIENTE_PRIMARIO}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.btnCorte}
          >
            <Feather name="check" size={18} color="#FFFFFF" />
            <Text style={styles.btnCorteTexto}>REGISTRAR CORTE REALIZADO</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── Modal: confirmação antes de remover ── */}
      <Modal
        visible={modalConfirmacaoVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setModalConfirmacaoVisivel(false)}
      >
        <Pressable
          style={styles.modalFundo}
          onPress={() => !registrando && setModalConfirmacaoVisivel(false)}
        >
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalIconeCirculo}>
              <Feather name="check-circle" size={26} color={CORES.primary} />
            </View>
            <Text style={styles.modalTitulo}>Registrar corte realizado?</Text>
            <Text style={styles.modalTexto}>
              Confirma que o corte no Trecho {ocorrencia.local} foi executado?
              {"\n"}A ocorrência será removida da lista de monitoramento.
            </Text>

            <View style={styles.modalBotoes}>
              <TouchableOpacity
                style={[styles.modalBotao, styles.modalBotaoCancelar]}
                onPress={() => setModalConfirmacaoVisivel(false)}
                disabled={registrando}
                activeOpacity={0.8}
              >
                <Text style={styles.modalBotaoCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBotao, styles.modalBotaoConfirmar]}
                onPress={confirmarCorte}
                disabled={registrando}
                activeOpacity={0.8}
              >
                <Text style={styles.modalBotaoConfirmarTexto}>
                  {registrando ? "Removendo..." : "Confirmar"}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Modal: sucesso após remover ── */}
      <Modal
        visible={modalSucessoVisivel}
        transparent
        animationType="fade"
        onRequestClose={fecharSucessoEVoltar}
      >
        <Pressable style={styles.modalFundo} onPress={fecharSucessoEVoltar}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalIconeCirculo, { backgroundColor: CORES.success + "22" }]}>
              <Feather name="check" size={26} color={CORES.success} />
            </View>
            <Text style={styles.modalTitulo}>Corte registrado!</Text>
            <Text style={styles.modalTexto}>
              O setor foi atualizado e removido do monitoramento de ocorrências.
            </Text>

            <TouchableOpacity
              style={[styles.modalBotao, styles.modalBotaoConfirmar, styles.modalBotaoLargo, { marginTop: 8 }]}
              onPress={fecharSucessoEVoltar}
              activeOpacity={0.8}
            >
              <Text style={styles.modalBotaoConfirmarTexto}>OK</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ── Sub-componente de métrica ──

function Metrica({
  icon,
  label,
  valor,
}: {
  icon: React.ReactNode;
  label: string;
  valor: string;
}) {
  return (
    <View style={styles.metrica}>
      <View style={styles.metricaIconeCirculo}>{icon}</View>
      <Text style={styles.metricaLabel}>{label}</Text>
      <Text style={styles.metricaValor}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CORES.background,
  },
  scroll: {
    paddingBottom: 110,
  },

  header: {
    backgroundColor: CORES.secondary,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 18,
  },
  headerLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  btnVoltar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
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

  droneWrap: {
    width: "100%",
    height: 230,
    position: "relative",
  },
  droneImagem: {
    width: "100%",
    height: "100%",
  },
  droneOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(229,72,77,0.28)",
    borderWidth: 2,
    borderColor: "rgba(229,72,77,0.55)",
  },
  liveBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: CORES.destructive,
  },
  liveTexto: {
    fontSize: 11,
    fontWeight: "600",
    color: CORES.foreground,
  },
  areaCriticaBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: CORES.destructive,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
  },
  areaCriticaTexto: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  localLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  localTexto: {
    fontSize: 13,
    color: CORES.mutedForeground,
  },

  predicaoCard: {
    backgroundColor: CORES.card,
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 8,
  },
  predicaoCabecalho: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
  },
  predicaoTitulo: {
    fontSize: 11,
    fontWeight: "800",
    color: CORES.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metricasGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metrica: {
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  metricaIconeCirculo: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: CORES.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  metricaLabel: {
    fontSize: 10,
    color: CORES.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  metricaValor: {
    fontSize: 14,
    fontWeight: "800",
    color: CORES.foreground,
  },

  recomendacaoCard: {
    backgroundColor: CORES.accent,
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    gap: 4,
  },
  recomendacaoTitulo: {
    fontSize: 11,
    fontWeight: "800",
    color: CORES.accentForeground,
    textTransform: "uppercase",
    letterSpacing: 1,
    opacity: 0.7,
  },
  recomendacaoTexto: {
    fontSize: 13,
    color: CORES.accentForeground,
    lineHeight: 20,
  },

  rodapeFixo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: CORES.background,
  },
  btnCorte: {
    height: 56,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  btnCorteTexto: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.5,
  },

  modalFundo: {
    flex: 1,
    backgroundColor: "rgba(28,37,54,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  modalCard: {
    backgroundColor: CORES.card,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  modalIconeCirculo: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: CORES.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  modalTitulo: {
    fontSize: 16,
    fontWeight: "800",
    color: CORES.foreground,
    textAlign: "center",
    marginBottom: 8,
  },
  modalTexto: {
    fontSize: 13,
    color: CORES.mutedForeground,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  modalBotoes: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  modalBotao: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBotaoCancelar: {
    backgroundColor: CORES.muted,
  },
  modalBotaoCancelarTexto: {
    fontSize: 14,
    fontWeight: "700",
    color: CORES.mutedForeground,
  },
  modalBotaoConfirmar: {
    backgroundColor: CORES.primary,
  },
  modalBotaoLargo: {
    width: "100%",
  },
  modalBotaoConfirmarTexto: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

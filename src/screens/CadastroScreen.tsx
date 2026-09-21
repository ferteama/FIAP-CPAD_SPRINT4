import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { useOcorrencias } from "../context/OcorrenciasContext";
import { NivelRisco } from "../types/nivelRisco";
import { CORES, COR_RISCO, GRADIENTE_PRIMARIO, LABEL_RISCO, SOMBRA_CARD, SOMBRA_FAB } from "../utils/tema";
import {
  alturaEstimada,
  climaSimulado,
  dataHoje,
  descricaoSugerida,
  distanciaSimulada,
  previsaoCorte,
} from "../utils/formatadores";
import {
  analisarFotoVegetacao,
  analisarFotoVegetacaoSimulado,
  VegetationApiError,
} from "../services/vegetationApi";

// ── Locais disponíveis (km das rodovias monitoradas) ──

const LOCAIS_DISPONIVEIS = [
  "KM 10",
  "KM 20",
  "KM 28",
  "KM 35",
  "KM 42",
  "KM 55",
  "KM 67",
];

const NIVEIS_RISCO: { valor: NivelRisco; label: string }[] = [
  { valor: "baixo", label: LABEL_RISCO.baixo },
  { valor: "medio", label: LABEL_RISCO.medio },
  { valor: "alto",  label: LABEL_RISCO.alto },
];

type CadastroScreenProps = {
  onVoltar: () => void;
  onSucesso: () => void;
};

export default function CadastroScreen({
  onVoltar,
  onSucesso,
}: CadastroScreenProps) {
  const { adicionarOcorrencia } = useOcorrencias();

  // ── Estado do formulário ──
  const [local, setLocal] = useState("KM 10");
  const [modalLocalVisivel, setModalLocalVisivel] = useState(false);
  const [modalFotoVisivel, setModalFotoVisivel] = useState(false);
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [risco, setRisco] = useState<NivelRisco | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [statusEnvio, setStatusEnvio] = useState<
    "idle" | "analisando" | "enviando"
  >("idle");

  // ── Handlers ──

  function selecionarLocal(valor: string) {
    setLocal(valor);
    setModalLocalVisivel(false);
  }

  /**
   * Abre a câmera do dispositivo
   * Aceita fotos no formato .jpg/.jpeg (padrão da câmera)
   */
  async function tirarFoto() {
    setModalFotoVisivel(false);

    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert(
        "Permissão necessária",
        "Conceda acesso à câmera nas configurações do dispositivo para tirar a foto."
      );
      return;
    }

    const resultado = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!resultado.canceled && resultado.assets?.[0]) {
      setFotoUri(resultado.assets[0].uri);
    }
  }

  /**
   * Abre a galeria do dispositivo
   * Aceita arquivos .png e .jpg/.jpeg
   */
  async function escolherDaGaleria() {
    setModalFotoVisivel(false);

    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert(
        "Permissão necessária",
        "Conceda acesso às fotos nas configurações do dispositivo para selecionar uma imagem."
      );
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!resultado.canceled && resultado.assets?.[0]) {
      setFotoUri(resultado.assets[0].uri);
    }
  }

  function removerFoto() {
    setFotoUri(null);
  }

  async function handleEnviar() {
    // Sem foto: exige classificação manual (fluxo original, sem IA).
    // Com foto: a classificação vem da análise de visão computacional.
    if (!fotoUri && !risco) {
      Alert.alert("Atenção", "Selecione uma classificação de risco ou anexe uma foto.");
      return;
    }

    // Deduz "Norte" ou "Sul" — alterna conforme paridade do número do KM
    const numeroKm = parseInt(local.replace("KM ", ""), 10);
    const direcao = numeroKm % 2 === 0 ? "Norte" : "Sul";
    const localCompleto = `${local} — ${direcao}`;

    setEnviando(true);
    try {
      if (fotoUri) {
        // ── Fluxo com foto: análise real via API (OpenCV) ──
        setStatusEnvio("analisando");
        try {
          const resultado = await analisarFotoVegetacao(fotoUri, localCompleto);
          await adicionarOcorrencia({
            local: localCompleto,
            descricao: `Análise por visão computacional: altura estimada ${resultado.alturaCm}cm (cobertura ${resultado.coberturaPercentual}%).`,
            risco: resultado.risco,
            data: dataHoje(),
            alturaGrama: `${resultado.alturaCm}cm`,
            distancia: distanciaSimulada(),
            previsaoCorte: `${resultado.previsaoDiasProximoCorte} dia(s)`,
            clima: climaSimulado(),
            fotoUri,
          });
        } catch (err) {
          // API indisponível (ex: backend fora do ar) — cai no modo
          // simulado em vez de travar o cadastro do operador.
          if (!(err instanceof VegetationApiError)) throw err;

          const resultadoSimulado = analisarFotoVegetacaoSimulado();
          await adicionarOcorrencia({
            local: localCompleto,
            descricao: `[modo offline] Altura estimada ${resultadoSimulado.alturaCm}cm (cobertura ${resultadoSimulado.coberturaPercentual}%). API de análise indisponível no momento.`,
            risco: resultadoSimulado.risco,
            data: dataHoje(),
            alturaGrama: `${resultadoSimulado.alturaCm}cm`,
            distancia: distanciaSimulada(),
            previsaoCorte: `${resultadoSimulado.previsaoDiasProximoCorte} dia(s)`,
            clima: climaSimulado(),
            fotoUri,
          });
        }
      } else {
        // ── Fluxo sem foto: classificação manual (como antes) ──
        setStatusEnvio("enviando");
        await adicionarOcorrencia({
          local: localCompleto,
          descricao: descricaoSugerida(risco as NivelRisco, localCompleto),
          risco: risco as NivelRisco,
          data: dataHoje(),
          alturaGrama: alturaEstimada(risco as NivelRisco),
          distancia: distanciaSimulada(),
          previsaoCorte: previsaoCorte(risco as NivelRisco),
          clima: climaSimulado(),
        });
      }

      Alert.alert("Enviado!", "Registro enviado para monitoramento.");
      onSucesso();
    } finally {
      setEnviando(false);
      setStatusEnvio("idle");
    }
  }

  // ── Render ──

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: CORES.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
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
            <Text style={styles.headerSubtitulo}>Registro manual</Text>
            <Text style={styles.headerTitulo}>Novo Registro</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Campo: Local (select) ── */}
        <View style={styles.campo}>
          <Text style={styles.campoLabel}>Local</Text>
          <TouchableOpacity
            style={[styles.select, SOMBRA_CARD]}
            onPress={() => setModalLocalVisivel(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.selectTexto}>{local}</Text>
            <Feather name="chevron-down" size={18} color={CORES.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* ── Campo: Foto do local ── */}
        <View style={styles.campo}>
          <Text style={styles.campoLabel}>Foto do local</Text>

          {fotoUri ? (
            <View style={styles.fotoPreviewWrap}>
              <Image
                source={{ uri: fotoUri }}
                style={styles.fotoPreview}
                resizeMode="cover"
              />
              {/* Botão remover foto */}
              <TouchableOpacity
                style={styles.fotoRemoverBotao}
                onPress={removerFoto}
                activeOpacity={0.8}
              >
                <Feather name="x" size={14} color="#FFFFFF" />
              </TouchableOpacity>
              {/* Botão trocar foto */}
              <TouchableOpacity
                style={styles.fotoTrocarBotao}
                onPress={() => setModalFotoVisivel(true)}
                activeOpacity={0.8}
              >
                <Feather name="repeat" size={12} color="#FFFFFF" />
                <Text style={styles.fotoTrocarTexto}>Trocar foto</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.fotoArea}
              onPress={() => setModalFotoVisivel(true)}
              activeOpacity={0.8}
            >
              <View style={styles.fotoIconeCirculo}>
                <Feather name="camera" size={20} color={CORES.primary} />
              </View>
              <Text style={styles.fotoTexto}>Tirar foto do local</Text>
              <Text style={styles.fotoSubTexto}>JPG ou PNG</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Campo: Classificação manual (só usada sem foto) ── */}
        <View style={styles.campo}>
          <Text style={styles.campoLabel}>Classificação manual</Text>
          {fotoUri ? (
            <Text style={styles.campoAjuda}>
              Com foto anexada, a classificação é calculada automaticamente
              pela análise de visão computacional (OpenCV) ao enviar.
            </Text>
          ) : (
            <Text style={styles.campoAjuda}>
              Sem foto, selecione manualmente a classificação de risco.
            </Text>
          )}
          <View style={[styles.gridRisco, fotoUri && { opacity: 0.4 }]}
            pointerEvents={fotoUri ? "none" : "auto"}
          >
            {NIVEIS_RISCO.map(({ valor, label }) => {
              const ativo = risco === valor;
              const cor = COR_RISCO[valor];
              return (
                <TouchableOpacity
                  key={valor}
                  style={[
                    styles.botaoRisco,
                    ativo
                      ? { backgroundColor: cor, ...estiloAtivo }
                      : { backgroundColor: CORES.card, borderWidth: 1, borderColor: CORES.border, ...SOMBRA_CARD },
                  ]}
                  onPress={() => setRisco(valor)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.botaoRiscoTexto,
                      { color: ativo ? "#FFFFFF" : CORES.foreground },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* ── Botão enviar (fixo no rodapé) ── */}
      <View style={styles.rodapeFixo}>
        <TouchableOpacity
          onPress={handleEnviar}
          disabled={enviando}
          activeOpacity={0.85}
          style={[{ borderRadius: 18 }, SOMBRA_FAB, enviando && { opacity: 0.6 }]}
        >
          <LinearGradient
            colors={GRADIENTE_PRIMARIO}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.btnEnviar}
          >
            <Feather name="send" size={18} color="#FFFFFF" />
            <Text style={styles.btnEnviarTexto}>
              {statusEnvio === "analisando"
                ? "Analisando foto..."
                : statusEnvio === "enviando"
                ? "Enviando..."
                : "Enviar para Monitoramento"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── Modal: seleção de local ── */}
      <Modal
        visible={modalLocalVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setModalLocalVisivel(false)}
      >
        <Pressable
          style={styles.modalFundo}
          onPress={() => setModalLocalVisivel(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>Selecione o local</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {LOCAIS_DISPONIVEIS.map((opcao) => (
                <TouchableOpacity
                  key={opcao}
                  style={[
                    styles.modalOpcao,
                    opcao === local && styles.modalOpcaoAtiva,
                  ]}
                  onPress={() => selecionarLocal(opcao)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.modalOpcaoTexto,
                      opcao === local && styles.modalOpcaoTextoAtivo,
                    ]}
                  >
                    {opcao}
                  </Text>
                  {opcao === local && (
                    <Feather name="check" size={16} color={CORES.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* ── Modal: escolher origem da foto (câmera / galeria) ── */}
      <Modal
        visible={modalFotoVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setModalFotoVisivel(false)}
      >
        <Pressable
          style={styles.modalFundo}
          onPress={() => setModalFotoVisivel(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>Foto do local</Text>

            <TouchableOpacity
              style={styles.modalAcao}
              onPress={tirarFoto}
              activeOpacity={0.7}
            >
              <View style={styles.modalAcaoIcone}>
                <Feather name="camera" size={18} color={CORES.primary} />
              </View>
              <View>
                <Text style={styles.modalAcaoTitulo}>Tirar foto</Text>
                <Text style={styles.modalAcaoSubtitulo}>Usar a câmera do dispositivo</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalAcao}
              onPress={escolherDaGaleria}
              activeOpacity={0.7}
            >
              <View style={styles.modalAcaoIcone}>
                <Feather name="image" size={18} color={CORES.primary} />
              </View>
              <View>
                <Text style={styles.modalAcaoTitulo}>Escolher da galeria</Text>
                <Text style={styles.modalAcaoSubtitulo}>Arquivos .jpg ou .png</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelar}
              onPress={() => setModalFotoVisivel(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// Estilo extra aplicado ao botão de risco ativo (escala leve + sombra)
const estiloAtivo = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.18,
  shadowRadius: 8,
  elevation: 4,
  transform: [{ scale: 1.03 }],
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    paddingBottom: 110,
    gap: 4,
  },

  header: {
    backgroundColor: CORES.secondary,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 22,
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

  campo: {
    marginBottom: 22,
  },
  campoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: CORES.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  campoAjuda: {
    fontSize: 11,
    color: CORES.mutedForeground,
    marginTop: -4,
    marginBottom: 10,
    lineHeight: 16,
  },

  select: {
    height: 50,
    backgroundColor: CORES.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CORES.border,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectTexto: {
    fontSize: 15,
    fontWeight: "600",
    color: CORES.foreground,
  },

  fotoArea: {
    aspectRatio: 16 / 9,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: CORES.border,
    borderStyle: "dashed",
    backgroundColor: CORES.muted,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  fotoIconeCirculo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: CORES.background,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  fotoTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: CORES.mutedForeground,
  },
  fotoSubTexto: {
    fontSize: 11,
    color: CORES.mutedForeground,
    opacity: 0.7,
  },

  fotoPreviewWrap: {
    aspectRatio: 16 / 9,
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
    backgroundColor: CORES.muted,
  },
  fotoPreview: {
    width: "100%",
    height: "100%",
  },
  fotoRemoverBotao: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(28,37,54,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  fotoTrocarBotao: {
    position: "absolute",
    bottom: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(28,37,54,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  fotoTrocarTexto: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },

  gridRisco: {
    flexDirection: "row",
    gap: 8,
  },
  botaoRisco: {
    flex: 1,
    height: 64,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  botaoRiscoTexto: {
    fontSize: 14,
    fontWeight: "800",
  },

  // Rodapé fixo
  rodapeFixo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: CORES.background,
  },
  btnEnviar: {
    height: 56,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  btnEnviarTexto: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },

  modalFundo: {
    flex: 1,
    backgroundColor: "rgba(28,37,54,0.5)",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  modalCard: {
    backgroundColor: CORES.card,
    borderRadius: 18,
    padding: 16,
  },
  modalTitulo: {
    fontSize: 14,
    fontWeight: "800",
    color: CORES.foreground,
    marginBottom: 10,
    paddingHorizontal: 6,
  },
  modalOpcao: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
  },
  modalOpcaoAtiva: {
    backgroundColor: CORES.accent,
  },
  modalOpcaoTexto: {
    fontSize: 15,
    fontWeight: "600",
    color: CORES.foreground,
  },
  modalOpcaoTextoAtivo: {
    color: CORES.primary,
  },

  // Modal de foto — ações
  modalAcao: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalAcaoIcone: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: CORES.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  modalAcaoTitulo: {
    fontSize: 14,
    fontWeight: "700",
    color: CORES.foreground,
  },
  modalAcaoSubtitulo: {
    fontSize: 11,
    color: CORES.mutedForeground,
    marginTop: 1,
  },
  modalCancelar: {
    marginTop: 6,
    paddingVertical: 12,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: CORES.border,
  },
  modalCancelarTexto: {
    fontSize: 14,
    fontWeight: "700",
    color: CORES.mutedForeground,
  },
});

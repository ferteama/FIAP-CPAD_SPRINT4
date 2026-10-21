import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { useAuth } from "../context/AuthContext";
import { useConfigDemo } from "../context/ConfigDemoContext";
import { StatusSync, useOcorrencias } from "../context/OcorrenciasContext";
import { CENARIOS, CenarioDados } from "../data/ocorrencias";
import { CORES, SOMBRA_CARD } from "../utils/tema";

const ROTULO_SYNC: Record<StatusSync, { texto: string; cor: string }> = {
  desativado: { texto: "Somente neste aparelho", cor: CORES.mutedForeground },
  sincronizando: { texto: "Sincronizando...", cor: CORES.primary },
  ok: { texto: "Sincronizado com o Firebase", cor: CORES.success },
  pendente: { texto: "Alterações aguardando envio", cor: CORES.warning },
  erro: { texto: "Falha na sincronização", cor: CORES.destructive },
};

/** Confirmação que funciona no mobile (Alert) e na web (window.confirm). */
function confirmar(titulo: string, mensagem: string, aoConfirmar: () => void) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.confirm(`${titulo}\n\n${mensagem}`)) aoConfirmar();
    return;
  }
  Alert.alert(titulo, mensagem, [
    { text: "Cancelar", style: "cancel" },
    { text: "Confirmar", style: "destructive", onPress: aoConfirmar },
  ]);
}

export default function PerfilScreen({ onVoltar }: { onVoltar: () => void }) {
  const { usuario, sair, firebaseAtivo } = useAuth();
  const { simularApiOffline, definirSimularApiOffline } = useConfigDemo();
  const { statusSync, ultimaSync, sincronizar, carregarCenario, ocorrencias, intervencoes } = useOcorrencias();
  const [cenarioAtivo, setCenarioAtivo] = useState<CenarioDados | null>(null);

  if (!usuario) return null;

  const iniciais = usuario.nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
  const sync = ROTULO_SYNC[statusSync];

  function trocarCenario(c: CenarioDados, titulo: string) {
    confirmar(
      `Carregar "${titulo}"?`,
      "Isso substitui as ocorrências e o histórico guardados neste aparelho. Os dados do Firebase não são apagados.",
      () => {
        carregarCenario(c);
        setCenarioAtivo(c);
      }
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.btnVoltar} onPress={onVoltar} activeOpacity={0.8} accessibilityLabel="Voltar">
          <Feather name="arrow-left" size={16} color="#FFFFFF" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerSubtitulo}>Conta e configurações</Text>
          <Text style={styles.headerTitulo}>Meu Perfil</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Usuário ── */}
        <View style={[styles.card, SOMBRA_CARD, styles.usuarioLinha]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>{iniciais || "?"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.nome}>{usuario.nome}</Text>
            <Text style={styles.email}>{usuario.email}</Text>
            {usuario.cargo ? <Text style={styles.cargo}>{usuario.cargo}</Text> : null}
          </View>
          <View style={[styles.tag, { backgroundColor: usuario.demo ? CORES.warning + "33" : CORES.accent }]}>
            <Text style={[styles.tagTexto, { color: usuario.demo ? CORES.warningForeground : CORES.accentForeground }]}>
              {usuario.demo ? "DEMO" : "FIREBASE"}
            </Text>
          </View>
        </View>

        {/* ── Sincronização ── */}
        <Text style={styles.secao}>Sincronização</Text>
        <View style={[styles.card, SOMBRA_CARD]}>
          <View style={styles.linha}>
            <View style={[styles.ponto, { backgroundColor: sync.cor }]} />
            <Text style={styles.linhaTexto}>{sync.texto}</Text>
            {statusSync === "sincronizando" && <ActivityIndicator size="small" color={CORES.primary} />}
          </View>
          <Text style={styles.ajuda}>
            {ocorrencias.length} trecho(s) ativo(s) · {intervencoes.length} intervenção(ões) no histórico
            {ultimaSync ? ` · última sincronização às ${new Date(ultimaSync).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : ""}
          </Text>
          {!firebaseAtivo || usuario.demo ? (
            <Text style={styles.ajuda}>
              Sem conta Firebase, os dados ficam só neste aparelho (AsyncStorage).
            </Text>
          ) : (
            <TouchableOpacity
              style={[styles.btnSecundario, statusSync === "sincronizando" && { opacity: 0.5 }]}
              onPress={sincronizar}
              disabled={statusSync === "sincronizando"}
              activeOpacity={0.8}
            >
              <Feather name="refresh-cw" size={14} color={CORES.primary} />
              <Text style={styles.btnSecundarioTexto}>Sincronizar agora</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Demonstração ── */}
        <Text style={styles.secao}>Cenários de demonstração</Text>
        <View style={[styles.card, SOMBRA_CARD]}>
          {CENARIOS.map((c, idx) => (
            <TouchableOpacity
              key={c.chave}
              style={[styles.cenario, idx > 0 && styles.cenarioBorda]}
              onPress={() => trocarCenario(c.chave, c.titulo)}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.cenarioTitulo}>{c.titulo}</Text>
                <Text style={styles.ajuda}>{c.descricao}</Text>
              </View>
              {cenarioAtivo === c.chave ? (
                <Feather name="check" size={16} color={CORES.primary} />
              ) : (
                <Feather name="chevron-right" size={16} color={CORES.mutedForeground} />
              )}
            </TouchableOpacity>
          ))}

          <View style={[styles.cenario, styles.cenarioBorda]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cenarioTitulo}>Simular API offline</Text>
              <Text style={styles.ajuda}>
                Força a falha da análise de foto para mostrar o fallback automático.
              </Text>
            </View>
            <Switch
              value={simularApiOffline}
              onValueChange={definirSimularApiOffline}
              trackColor={{ true: CORES.primaryGlow, false: CORES.border }}
              thumbColor={simularApiOffline ? CORES.primary : "#FFFFFF"}
              accessibilityLabel="Simular API offline"
            />
          </View>
        </View>

        {/* ── Sair ── */}
        <TouchableOpacity
          style={styles.btnSair}
          onPress={() => confirmar("Sair da conta?", "Você precisará entrar novamente.", () => sair())}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={16} color={CORES.destructive} />
          <Text style={styles.btnSairTexto}>Sair da conta</Text>
        </TouchableOpacity>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.background },
  header: {
    backgroundColor: CORES.secondary,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 18,
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
  headerSubtitulo: { fontSize: 11, color: "rgba(255,255,255,0.7)" },
  headerTitulo: { fontSize: 18, fontWeight: "800", color: "#FFFFFF", marginTop: 2 },
  scroll: { padding: 20 },
  secao: { fontSize: 12, fontWeight: "800", color: CORES.foreground, marginTop: 20, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  card: { backgroundColor: CORES.card, borderRadius: 18, padding: 16 },
  usuarioLinha: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: CORES.primary, alignItems: "center", justifyContent: "center" },
  avatarTexto: { color: "#FFFFFF", fontWeight: "800", fontSize: 16 },
  nome: { fontSize: 15, fontWeight: "800", color: CORES.foreground },
  email: { fontSize: 12, color: CORES.mutedForeground, marginTop: 1 },
  cargo: { fontSize: 11, color: CORES.primary, fontWeight: "700", marginTop: 2 },
  tag: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  tagTexto: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  linha: { flexDirection: "row", alignItems: "center", gap: 8 },
  ponto: { width: 8, height: 8, borderRadius: 4 },
  linhaTexto: { fontSize: 13, fontWeight: "700", color: CORES.foreground, flex: 1 },
  ajuda: { fontSize: 11, color: CORES.mutedForeground, marginTop: 4, lineHeight: 16 },
  btnSecundario: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12, paddingVertical: 11, borderRadius: 12, backgroundColor: CORES.accent },
  btnSecundarioTexto: { fontSize: 13, fontWeight: "700", color: CORES.primary },
  cenario: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  cenarioBorda: { borderTopWidth: 1, borderTopColor: CORES.border },
  cenarioTitulo: { fontSize: 13, fontWeight: "700", color: CORES.foreground },
  btnSair: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 24, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: CORES.destructive + "55" },
  btnSairTexto: { fontSize: 14, fontWeight: "700", color: CORES.destructive },
});

import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";

import { useAuth } from "../context/AuthContext";
import { CORES, GRADIENTE_HEADER, GRADIENTE_PRIMARIO, SOMBRA_CARD } from "../utils/tema";
import { ErrosCadastro, emailValido, validarCadastro, validarLogin } from "../utils/validacao";

type Modo = "entrar" | "cadastrar";

export default function LoginScreen() {
  const { entrar, cadastrar, recuperarSenha, entrarModoDemo, firebaseAtivo } = useAuth();

  const [modo, setModo] = useState<Modo>("entrar");
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [erros, setErros] = useState<ErrosCadastro>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function trocarModo(novo: Modo) {
    setModo(novo);
    setErros({});
    setErroGeral(null);
    setAviso(null);
  }

  async function enviar() {
    setErroGeral(null);
    setAviso(null);

    const errosValidacao =
      modo === "entrar"
        ? validarLogin(email, senha)
        : validarCadastro({ nome, email, senha, confirmacao });
    setErros(errosValidacao);
    if (Object.keys(errosValidacao).length > 0) return;

    setEnviando(true);
    try {
      if (modo === "entrar") await entrar(email, senha);
      else await cadastrar(nome, email, senha, cargo);
      // Sucesso: o AuthContext atualiza o usuário e o App troca de tela sozinho.
    } catch (e: any) {
      setErroGeral(e?.message ?? "Não foi possível concluir.");
    } finally {
      setEnviando(false);
    }
  }

  async function esqueciSenha() {
    setErroGeral(null);
    setAviso(null);
    if (!emailValido(email)) {
      setErros({ email: "Informe seu e-mail para receber o link de redefinição." });
      return;
    }
    setErros({});
    setEnviando(true);
    try {
      await recuperarSenha(email);
      setAviso("Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.");
    } catch (e: any) {
      setErroGeral(e?.message ?? "Não foi possível enviar o e-mail.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={GRADIENTE_HEADER}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.logoBadge}>
            <Image
              source={require("../../assets/motiva-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.titulo}>Drone Vision Watch</Text>
          <Text style={styles.subtitulo}>
            Monitoramento de vegetação nas rodovias · Equipe 11
          </Text>
        </LinearGradient>

        <View style={[styles.card, SOMBRA_CARD]}>
          {/* Alternância Entrar / Criar conta */}
          <View style={styles.abas}>
            {(["entrar", "cadastrar"] as Modo[]).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.aba, modo === m && styles.abaAtiva]}
                onPress={() => trocarModo(m)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={m === "entrar" ? "Entrar" : "Criar conta"}
              >
                <Text style={[styles.abaTexto, modo === m && styles.abaTextoAtivo]}>
                  {m === "entrar" ? "Entrar" : "Criar conta"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {!firebaseAtivo && (
            <View style={styles.bannerAviso}>
              <Feather name="alert-triangle" size={14} color={CORES.warningForeground} />
              <Text style={styles.bannerAvisoTexto}>
                Firebase não configurado neste build (veja .env.example). Use o modo
                demonstração para explorar o app.
              </Text>
            </View>
          )}

          {firebaseAtivo && (
            <>
              {modo === "cadastrar" && (
                <>
                  <Campo
                    label="Nome completo"
                    valor={nome}
                    onChange={setNome}
                    erro={erros.nome}
                    placeholder="Ex.: Maria Souza"
                    autoCapitalize="words"
                  />
                  <Campo
                    label="Cargo (opcional)"
                    valor={cargo}
                    onChange={setCargo}
                    placeholder="Ex.: Operador de campo"
                    autoCapitalize="sentences"
                  />
                </>
              )}

              <Campo
                label="E-mail"
                valor={email}
                onChange={setEmail}
                erro={erros.email}
                placeholder="voce@empresa.com"
                teclado="email-address"
              />
              <Campo
                label="Senha"
                valor={senha}
                onChange={setSenha}
                erro={erros.senha}
                placeholder="Mínimo de 6 caracteres"
                senha={!mostrarSenha}
                acao={{
                  icone: mostrarSenha ? "eye-off" : "eye",
                  aoPressionar: () => setMostrarSenha((v) => !v),
                }}
              />
              {modo === "cadastrar" && (
                <Campo
                  label="Confirmar senha"
                  valor={confirmacao}
                  onChange={setConfirmacao}
                  erro={erros.confirmacao}
                  placeholder="Repita a senha"
                  senha={!mostrarSenha}
                />
              )}

              {erroGeral && (
                <View style={styles.bannerErro} accessibilityRole="alert">
                  <Feather name="x-circle" size={14} color={CORES.destructive} />
                  <Text style={styles.bannerErroTexto}>{erroGeral}</Text>
                </View>
              )}
              {aviso && (
                <View style={styles.bannerSucesso}>
                  <Feather name="check-circle" size={14} color={CORES.primary} />
                  <Text style={styles.bannerSucessoTexto}>{aviso}</Text>
                </View>
              )}

              <TouchableOpacity
                onPress={enviar}
                disabled={enviando}
                activeOpacity={0.85}
                style={[{ borderRadius: 14, marginTop: 6 }, enviando && { opacity: 0.6 }]}
              >
                <LinearGradient
                  colors={GRADIENTE_PRIMARIO}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.btnPrincipal}
                >
                  {enviando ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.btnPrincipalTexto}>
                      {modo === "entrar" ? "Entrar" : "Criar conta"}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {modo === "entrar" && (
                <TouchableOpacity onPress={esqueciSenha} disabled={enviando} style={styles.link}>
                  <Text style={styles.linkTexto}>Esqueci minha senha</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {!firebaseAtivo && (
            <TouchableOpacity onPress={entrarModoDemo} activeOpacity={0.85} style={{ borderRadius: 14 }}>
              <LinearGradient
                colors={GRADIENTE_PRIMARIO}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.btnPrincipal}
              >
                <Text style={styles.btnPrincipalTexto}>Entrar em modo demonstração</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Campo de formulário reutilizável ──

type CampoProps = {
  label: string;
  valor: string;
  onChange: (v: string) => void;
  erro?: string;
  placeholder?: string;
  senha?: boolean;
  teclado?: "default" | "email-address";
  autoCapitalize?: "none" | "words" | "sentences";
  acao?: { icone: keyof typeof Feather.glyphMap; aoPressionar: () => void };
};

function Campo({
  label,
  valor,
  onChange,
  erro,
  placeholder,
  senha,
  teclado = "default",
  autoCapitalize = "none",
  acao,
}: CampoProps) {
  return (
    <View style={styles.campo}>
      <Text style={styles.campoLabel}>{label}</Text>
      <View style={[styles.inputLinha, erro ? styles.inputErro : null]}>
        <TextInput
          style={styles.input}
          value={valor}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={CORES.mutedForeground}
          secureTextEntry={senha}
          keyboardType={teclado}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          accessibilityLabel={label}
        />
        {acao && (
          <TouchableOpacity onPress={acao.aoPressionar} hitSlop={10} accessibilityLabel="Mostrar ou ocultar senha">
            <Feather name={acao.icone} size={16} color={CORES.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>
      {erro ? <Text style={styles.campoErro}>{erro}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.background },
  scroll: { paddingBottom: 32 },
  header: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 56 },
  logoBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logo: { width: 76, height: 22 },
  titulo: { fontSize: 26, fontWeight: "800", color: "#FFFFFF", marginTop: 24 },
  subtitulo: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 6, lineHeight: 18 },

  card: {
    backgroundColor: CORES.card,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginTop: -32,
  },
  abas: {
    flexDirection: "row",
    backgroundColor: CORES.muted,
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
  },
  aba: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: "center" },
  abaAtiva: { backgroundColor: CORES.card },
  abaTexto: { fontSize: 13, fontWeight: "700", color: CORES.mutedForeground },
  abaTextoAtivo: { color: CORES.primary },

  campo: { marginBottom: 14 },
  campoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: CORES.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputLinha: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: CORES.border,
    borderRadius: 12,
    backgroundColor: CORES.background,
    paddingHorizontal: 12,
  },
  inputErro: { borderColor: CORES.destructive },
  input: { flex: 1, height: 46, fontSize: 14, color: CORES.foreground },
  campoErro: { fontSize: 11, color: CORES.destructive, marginTop: 4 },

  bannerAviso: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: CORES.warning + "33",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: "flex-start",
  },
  bannerAvisoTexto: { flex: 1, fontSize: 12, color: CORES.warningForeground, lineHeight: 17 },
  bannerErro: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: CORES.destructive + "18",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: "center",
  },
  bannerErroTexto: { flex: 1, fontSize: 12, color: CORES.destructive },
  bannerSucesso: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: CORES.accent,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: "center",
  },
  bannerSucessoTexto: { flex: 1, fontSize: 12, color: CORES.accentForeground },

  btnPrincipal: { height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  btnPrincipalTexto: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
  link: { alignItems: "center", marginTop: 14 },
  linkTexto: { fontSize: 12, fontWeight: "700", color: CORES.primary },
});

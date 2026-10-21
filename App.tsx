import React, { useState } from "react";
import { ActivityIndicator, SafeAreaView, StatusBar, StyleSheet, View } from "react-native";

import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { ConfigDemoProvider } from "./src/context/ConfigDemoContext";
import { OcorrenciasProvider } from "./src/context/OcorrenciasContext";
import LoginScreen from "./src/screens/LoginScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import ListaScreen from "./src/screens/ListaScreen";
import CadastroScreen from "./src/screens/CadastroScreen";
import DetalheScreen from "./src/screens/DetalheScreen";
import HistoricoScreen from "./src/screens/HistoricoScreen";
import RelatorioScreen from "./src/screens/RelatorioScreen";
import PerfilScreen from "./src/screens/PerfilScreen";
import { BottomNav, AbaNav } from "./src/components";
import { Ocorrencia } from "./src/interfaces/ocorrencia";
import { CORES } from "./src/utils/tema";

// "detalhe" e "perfil" ficam fora das abas — são telas de drill-down,
// acessadas a partir das abas, sem entrada própria na barra inferior.
type Tela = AbaNav | "detalhe" | "perfil";

export default function App() {
  return (
    <AuthProvider>
      <ConfigDemoProvider>
        <StatusBar barStyle="dark-content" backgroundColor={CORES.background} />
        <SafeAreaView style={styles.safeArea}>
          <Raiz />
        </SafeAreaView>
      </ConfigDemoProvider>
    </AuthProvider>
  );
}

/** Porteiro de autenticação: restaura sessão → login → app. */
function Raiz() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={CORES.primary} />
      </View>
    );
  }

  if (!usuario) return <LoginScreen />;

  // key = uid: ao trocar de conta, o provider reinicia com o cache do novo usuário
  return (
    <OcorrenciasProvider key={usuario.uid}>
      <Navegacao />
    </OcorrenciasProvider>
  );
}

function Navegacao() {
  const [telaAtual, setTelaAtual] = useState<Tela>("dashboard");
  // Aba de onde veio o drill-down, para o "voltar" cair no lugar certo
  const [abaAnterior, setAbaAnterior] = useState<AbaNav>("dashboard");
  const [ocorrenciaSelecionada, setOcorrenciaSelecionada] = useState<Ocorrencia | null>(null);

  function abrirDrillDown(destino: "detalhe" | "perfil") {
    if (telaAtual !== "detalhe" && telaAtual !== "perfil") setAbaAnterior(telaAtual);
    setTelaAtual(destino);
  }

  function irParaDetalhe(ocorrencia: Ocorrencia) {
    setOcorrenciaSelecionada(ocorrencia);
    abrirDrillDown("detalhe");
  }

  function voltarDoDrillDown() {
    setOcorrenciaSelecionada(null);
    setTelaAtual(abaAnterior);
  }

  function selecionarAba(aba: AbaNav) {
    setOcorrenciaSelecionada(null);
    setTelaAtual(aba);
  }

  function renderTela() {
    switch (telaAtual) {
      case "dashboard":
        return (
          <DashboardScreen
            onNovaVistoria={() => selecionarAba("cadastro")}
            onVerTrechos={() => selecionarAba("lista")}
            onVerDetalhe={irParaDetalhe}
            onAbrirPerfil={() => abrirDrillDown("perfil")}
          />
        );
      case "lista":
        return (
          <ListaScreen
            onVerDetalhe={irParaDetalhe}
            onNovaCadastro={() => selecionarAba("cadastro")}
          />
        );
      case "cadastro":
        return (
          <CadastroScreen
            onVoltar={() => selecionarAba("dashboard")}
            onSucesso={() => selecionarAba("dashboard")}
          />
        );
      case "historico":
        return <HistoricoScreen />;
      case "relatorio":
        return <RelatorioScreen />;
      case "perfil":
        return <PerfilScreen onVoltar={voltarDoDrillDown} />;
      case "detalhe":
        if (!ocorrenciaSelecionada) return null;
        return <DetalheScreen ocorrencia={ocorrenciaSelecionada} onVoltar={voltarDoDrillDown} />;
      default:
        return null;
    }
  }

  const mostrarNavInferior = telaAtual !== "detalhe" && telaAtual !== "perfil";

  return (
    <>
      <View style={{ flex: 1 }}>{renderTela()}</View>
      {mostrarNavInferior && <BottomNav abaAtiva={telaAtual} onSelecionar={selecionarAba} />}
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: CORES.background },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: CORES.background },
});

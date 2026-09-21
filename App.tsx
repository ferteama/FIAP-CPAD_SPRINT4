import React, { useState } from "react";
import { SafeAreaView, StatusBar, StyleSheet, View } from "react-native";

import { OcorrenciasProvider } from "./src/context/OcorrenciasContext";
import DashboardScreen from "./src/screens/DashboardScreen";
import ListaScreen from "./src/screens/ListaScreen";
import CadastroScreen from "./src/screens/CadastroScreen";
import DetalheScreen from "./src/screens/DetalheScreen";
import RelatorioScreen from "./src/screens/RelatorioScreen";
import { BottomNav, AbaNav } from "./src/components";
import { Ocorrencia } from "./src/interfaces/ocorrencia";
import { CORES } from "./src/utils/tema";

// "detalhe" fica fora das abas — é uma tela de "drill-down" acessada
// a partir do Dashboard ou da lista de Trechos, sem entrada própria na nav.
type Tela = AbaNav | "detalhe";

export default function App() {
  // Estado de navegação — controla qual tela/aba está visível
  const [telaAtual, setTelaAtual] = useState<Tela>("dashboard");

  // Guarda a aba de onde veio o "detalhe", para voltar ao lugar certo
  const [abaAnterior, setAbaAnterior] = useState<AbaNav>("dashboard");

  // Ocorrência selecionada para o detalhe
  const [ocorrenciaSelecionada, setOcorrenciaSelecionada] =
    useState<Ocorrencia | null>(null);

  function irParaDetalhe(ocorrencia: Ocorrencia) {
    setAbaAnterior(telaAtual === "detalhe" ? abaAnterior : (telaAtual as AbaNav));
    setOcorrenciaSelecionada(ocorrencia);
    setTelaAtual("detalhe");
  }

  function irParaCadastro() {
    setTelaAtual("cadastro");
  }

  function irParaLista() {
    setOcorrenciaSelecionada(null);
    setTelaAtual("lista");
  }

  function irParaDashboard() {
    setOcorrenciaSelecionada(null);
    setTelaAtual("dashboard");
  }

  function voltarDoDetalhe() {
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
            onNovaVistoria={irParaCadastro}
            onVerTrechos={irParaLista}
            onVerDetalhe={irParaDetalhe}
          />
        );

      case "lista":
        return (
          <ListaScreen
            onVerDetalhe={irParaDetalhe}
            onNovaCadastro={irParaCadastro}
          />
        );

      case "cadastro":
        return (
          <CadastroScreen
            onVoltar={irParaDashboard}
            onSucesso={irParaDashboard}
          />
        );

      case "relatorio":
        return <RelatorioScreen />;

      case "detalhe":
        if (!ocorrenciaSelecionada) return null;
        return (
          <DetalheScreen
            ocorrencia={ocorrenciaSelecionada}
            onVoltar={voltarDoDetalhe}
          />
        );

      default:
        return null;
    }
  }

  // A navegação inferior fica escondida na tela de detalhe (drill-down)
  const mostrarNavInferior = telaAtual !== "detalhe";

  return (
    <OcorrenciasProvider>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={CORES.background}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1 }}>{renderTela()}</View>
        {mostrarNavInferior && (
          <BottomNav abaAtiva={telaAtual} onSelecionar={selecionarAba} />
        )}
      </SafeAreaView>
    </OcorrenciasProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: CORES.background,
  },
});

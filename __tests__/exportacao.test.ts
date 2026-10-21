import { Ocorrencia } from "../src/interfaces/ocorrencia";
import { Intervencao } from "../src/interfaces/intervencao";
import { escaparCsv, escaparHtml, gerarCsvIntervencoes, gerarCsvOcorrencias, gerarHtmlRelatorio } from "../src/utils/exportacao";

const oc: Ocorrencia = { id: "1", descricao: 'Texto com ; ponto e vírgula e "aspas"', local: "KM 42 — Norte", risco: "alto", data: "10/10/2026", alturaGrama: "17cm", distancia: "3 km", previsaoCorte: "1 dia", clima: "28°C" };
const iv: Intervencao = { id: "i", ocorrenciaId: "1", local: "KM 42 — Norte", riscoAntes: "alto", alturaAntes: "17cm", dataDeteccao: "10/10/2026", dataCorte: "12/10/2026", timestamp: 1, responsavel: "Ana", observacao: "<b>negrito</b>" };

describe("exportação", () => {
  test("CSV escapa separador, aspas e quebra de linha", () => {
    expect(escaparCsv('a;b')).toBe('"a;b"');
    expect(escaparCsv('diz "oi"')).toBe('"diz ""oi"""');
    expect(escaparCsv("linha1\nlinha2")).toBe('"linha1\nlinha2"');
    expect(escaparCsv(undefined)).toBe("");
  });

  test("CSV neutraliza injeção de fórmula", () => {
    expect(escaparCsv("=1+1")).toBe("'=1+1");
    expect(escaparCsv("@SOMA(A1)")).toBe("'@SOMA(A1)");
  });

  test("CSV de trechos tem BOM, cabeçalho e uma linha por ocorrência", () => {
    const csv = gerarCsvOcorrencias([oc]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const linhas = csv.split("\r\n");
    expect(linhas).toHaveLength(2);
    expect(linhas[0]).toContain("Trecho;Data de detecção");
    expect(linhas[1]).toContain("KM 42 — Norte;10/10/2026;Alto;17cm");
  });

  test("CSV de histórico calcula os dias até o corte", () => {
    const linhas = gerarCsvIntervencoes([iv]).split("\r\n");
    expect(linhas[1]).toContain(";2;Alto;17cm;Ana;");
  });

  test("listas vazias geram só o cabeçalho", () => {
    expect(gerarCsvOcorrencias([]).split("\r\n")).toHaveLength(1);
    expect(gerarCsvIntervencoes([]).split("\r\n")).toHaveLength(1);
  });

  test("HTML do PDF escapa conteúdo de usuário", () => {
    expect(escaparHtml('<script>"x"&')).toBe("&lt;script&gt;&quot;x&quot;&amp;");
    const html = gerarHtmlRelatorio([oc], [iv], "Ana <admin>", new Date(2026, 9, 19));
    expect(html).not.toContain("<b>negrito</b>");
    expect(html).toContain("&lt;b&gt;negrito&lt;/b&gt;");
    expect(html).toContain("Ana &lt;admin&gt;");
    expect(html).toContain("19/10/2026");
  });

  test("HTML do PDF trata estados vazios", () => {
    const html = gerarHtmlRelatorio([], [], "Ana", new Date(2026, 9, 19));
    expect(html).toContain("Nenhum trecho em monitoramento.");
    expect(html).toContain("Nenhuma intervenção registrada.");
  });
});

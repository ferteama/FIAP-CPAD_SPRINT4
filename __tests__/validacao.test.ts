import { emailValido, traduzirErroAuth, validarCadastro, validarLogin } from "../src/utils/validacao";
import { configuracaoValida } from "../src/services/firebaseConfig";

describe("validação de login e cadastro", () => {
  test("e-mails", () => {
    expect(emailValido("ana@motiva.com.br")).toBe(true);
    expect(emailValido(" ana@motiva.com ")).toBe(true);
    expect(emailValido("ana@motiva")).toBe(false);
    expect(emailValido("ana motiva@x.com")).toBe(false);
    expect(emailValido("")).toBe(false);
  });

  test("cadastro válido não gera erros", () => {
    expect(validarCadastro({ nome: "Ana Souza", email: "ana@x.com", senha: "123456", confirmacao: "123456" })).toEqual({});
  });

  test("cadastro inválido aponta cada campo", () => {
    const e = validarCadastro({ nome: "Al", email: "x", senha: "123", confirmacao: "999" });
    expect(Object.keys(e).sort()).toEqual(["confirmacao", "email", "nome", "senha"]);
  });

  test("login exige e-mail válido e senha", () => {
    expect(validarLogin("a@b.co", "x")).toEqual({});
    expect(Object.keys(validarLogin("a", ""))).toEqual(["email", "senha"]);
  });

  test("erros do Firebase são traduzidos e há mensagem padrão", () => {
    expect(traduzirErroAuth("auth/invalid-credential")).toMatch(/incorretos/);
    expect(traduzirErroAuth("auth/email-already-in-use")).toMatch(/Já existe/);
    expect(traduzirErroAuth("auth/network-request-failed")).toMatch(/conexão/);
    expect(traduzirErroAuth("codigo/desconhecido")).toMatch(/Tente novamente/);
    expect(traduzirErroAuth(undefined)).toMatch(/Tente novamente/);
  });
});

describe("configuração do Firebase", () => {
  test("vazia ou com placeholder do .env.example = não configurado", () => {
    expect(configuracaoValida({ apiKey: "", projectId: "", appId: "" })).toBe(false);
    expect(configuracaoValida({ apiKey: "sua-api-key", projectId: "sua-projeto", appId: "sua-app-id" })).toBe(false);
  });
  test("chaves reais = configurado", () => {
    expect(configuracaoValida({ apiKey: "AIzaXYZ", projectId: "drone-watch", appId: "1:123:web:abc" })).toBe(true);
  });
});

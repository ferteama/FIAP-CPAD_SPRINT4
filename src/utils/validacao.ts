/**
 * validacao.ts — validações e mensagens de erro do login/cadastro.
 * Funções puras (testadas em __tests__/validacao.test.ts).
 */

export function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export type ErrosCadastro = Partial<Record<"nome" | "email" | "senha" | "confirmacao", string>>;

export function validarCadastro(dados: {
  nome: string;
  email: string;
  senha: string;
  confirmacao: string;
}): ErrosCadastro {
  const erros: ErrosCadastro = {};
  if (dados.nome.trim().length < 3) erros.nome = "Informe seu nome completo (mín. 3 letras).";
  if (!emailValido(dados.email)) erros.email = "E-mail inválido.";
  if (dados.senha.length < 6) erros.senha = "A senha precisa ter ao menos 6 caracteres.";
  if (dados.confirmacao !== dados.senha) erros.confirmacao = "As senhas não coincidem.";
  return erros;
}

export function validarLogin(email: string, senha: string): ErrosCadastro {
  const erros: ErrosCadastro = {};
  if (!emailValido(email)) erros.email = "E-mail inválido.";
  if (senha.length === 0) erros.senha = "Informe a senha.";
  return erros;
}

/** Traduz códigos de erro do Firebase Auth para mensagens claras ao operador. */
export function traduzirErroAuth(codigo: string | undefined): string {
  switch (codigo) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-mail ou senha incorretos.";
    case "auth/invalid-email":
      return "E-mail inválido.";
    case "auth/email-already-in-use":
      return "Já existe uma conta com esse e-mail.";
    case "auth/weak-password":
      return "Senha fraca: use ao menos 6 caracteres.";
    case "auth/network-request-failed":
      return "Sem conexão com a internet. Tente novamente.";
    case "auth/too-many-requests":
      return "Muitas tentativas. Aguarde um pouco e tente de novo.";
    case "auth/operation-not-allowed":
      return "Login por e-mail/senha não está habilitado no Firebase do projeto.";
    case "auth/user-disabled":
      return "Esta conta foi desativada.";
    default:
      return "Não foi possível concluir. Tente novamente.";
  }
}

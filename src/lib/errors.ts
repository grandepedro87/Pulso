/** Maps backend errors to friendly Portuguese messages. */
export function friendlyError(err: unknown, fallback = "Algo deu errado. Tente novamente."): string {
  const msg = err instanceof Error ? err.message : typeof err === "object" && err && "message" in err ? String((err as { message: unknown }).message) : "";
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (m.includes("user already registered")) return "Já existe uma conta com este e-mail.";
  if (m.includes("password should be") || m.includes("weak password"))
    return "Senha fraca: use pelo menos 8 caracteres, misturando letras e números.";
  if (m.includes("pwned") || m.includes("leaked")) return "Essa senha apareceu em vazamentos. Escolha outra.";
  if (m.includes("rate limit") || m.includes("too many")) return "Muitas tentativas. Aguarde um pouco e tente de novo.";
  if (m.includes("current password")) return "Senha atual incorreta ou não informada.";
  if (m.includes("same password") || m.includes("different from the old"))
    return "A nova senha precisa ser diferente da atual.";
  if (m.includes("network") || m.includes("failed to fetch")) return "Sem conexão. Verifique sua internet.";
  if (m.includes("row-level security") || m.includes("permission denied") || m.includes("acesso negado"))
    return "Você não tem permissão para esta ação.";
  if (msg && /[áéíóúãõç]/i.test(msg)) return msg;
  return fallback;
}

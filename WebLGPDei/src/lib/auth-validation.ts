const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HAS_LOWER = /[a-z]/;
const HAS_UPPER = /[A-Z]/;
const HAS_SYMBOL = /[^A-Za-z0-9]/;

export type ValidationType =
  | "name"
  | "email"
  | "password"
  | "passwordStrict"
  | "confirmPassword";

export type AuthField = "name" | "email" | "password" | "confirmPassword";

export type AuthFieldErrors = Partial<Record<AuthField, string>>;

function requiredMessage(label: string): string {
  return `O campo ${label.toLowerCase()} é obrigatório`;
}

/**
 * Valida um campo.
 * @param value - valor do campo
 * @param type - tipo de validação
 * @param label - nome do campo nas mensagens
 * @param matchValue - valor de referência (ex.: senha original em confirmPassword)
 */
export function validate(
  value: string,
  type: ValidationType,
  label: string,
  matchValue?: string,
): string | null {
  const trimmed = value.trim();

  switch (type) {
    case "confirmPassword":
      if (!value) return requiredMessage(label);
      if (value !== matchValue) return "As senhas não coincidem";
      return null;
    case "password":
    case "passwordStrict":
      if (!value) return requiredMessage(label);
      if (type === "password") return null;

      if (value.length < 8) return `${label} deve ter pelo menos 8 caracteres`;
      if (!HAS_LOWER.test(value)) return `${label} deve incluir pelo menos uma letra minúscula`;
      if (!HAS_UPPER.test(value)) return `${label} deve incluir pelo menos uma letra maiúscula`;
      if (!HAS_SYMBOL.test(value)) return `${label} deve incluir pelo menos um símbolo`;
      return null;
    case "name":
      if (trimmed.length < 2) return `${label} deve ter pelo menos 2 caracteres`;
      
      return null;
    case "email":
      if (!EMAIL_REGEX.test(trimmed)) return `Informe um ${label.toLowerCase()} válido`;
  }
  if (!trimmed) return requiredMessage(label);


  return null;
}

export function validateAuthForm(
  mode: "login" | "register",
  values: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  },
): AuthFieldErrors {
  const errors: AuthFieldErrors = {};

  if (mode === "register") {
    const nameError = validate(values.name, "name", "Nome");
    if (nameError) errors.name = nameError;
  }

  const emailError = validate(values.email, "email", "E-mail");
  if (emailError) errors.email = emailError;

  const passwordError = validate(
    values.password,
    mode === "register" ? "passwordStrict" : "password",
    "Senha",
  );
  if (passwordError) errors.password = passwordError;

  if (mode === "register") {
    const confirmError = validate(
      values.confirmPassword,
      "confirmPassword",
      "Confirmar senha",
      values.password,
    );
    if (confirmError) errors.confirmPassword = confirmError;
  }

  return errors;
}

export function hasAuthErrors(errors: AuthFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

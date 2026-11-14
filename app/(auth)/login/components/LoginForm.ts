import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { loginUser, resolvePostAuthRoute } from "@/lib/auth-api";

const loginValidation = {
  email: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
  password: /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/,
} as const;

export function useLoginForm() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const emailIsValid = loginValidation.email.test(email);
  const passwordIsValid = loginValidation.password.test(password);
  const inputClass =
    "min-w-0 flex-1 bg-transparent text-sm text-[#17243d] outline-none placeholder:text-[#8e92a3]";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({ email: true, password: true });
    setSubmitError("");

    if (!emailIsValid || !passwordIsValid) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await loginUser({ email, password });
      if (!response) {
        throw new Error("El servidor no devolvió los datos de autenticación.");
      }
      // Carga la sesión en AuthProvider antes de navegar: los layouts de admin y restaurante
      // redirigen a /login si al montarse ven user === null.
      await refresh();
      const redirectTo = new URLSearchParams(window.location.search).get("redirect");
      router.push(resolvePostAuthRoute(response, redirectTo));
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No fue posible iniciar sesión.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    showPassword,
    setShowPassword,
    email,
    setEmail,
    password,
    setPassword,
    touched,
    setTouched,
    isSubmitting,
    submitError,
    emailIsValid,
    passwordIsValid,
    inputClass,
    handleSubmit,
  };
}

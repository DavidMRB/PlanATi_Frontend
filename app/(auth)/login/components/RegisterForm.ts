import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { EMPTY_CONSENT, consentsAccepted, type ConsentValue } from "@/components/privacy/ConsentCheckboxes";
import { registerUser } from "@/lib/auth-api";
import { consentPayload } from "@/lib/legal";
import { CONSENT_OUTDATED_MESSAGE, isConsentVersionOutdated } from "@/lib/privacy-api";

const registerValidation = {
  name: /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]{1,50}$/,
  email: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
  phone: /^3[0-9]{9}$/,
  password: {
    length: (value: string) => value.length >= 8,
    uppercase: (value: string) => /[A-Z]/.test(value),
    symbol: (value: string) => /[^A-Za-z0-9]/.test(value),
    number: (value: string) => /[0-9]/.test(value),
  },
} as const;

function getPasswordRules(value: string) {
  return {
    length: registerValidation.password.length(value),
    uppercase: registerValidation.password.uppercase(value),
    symbol: registerValidation.password.symbol(value),
    number: registerValidation.password.number(value),
  };
}

export function useRegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
    password: false,
  });
  // Autorización de datos y términos: sin marcar por defecto (B8).
  const [consent, setConsent] = useState<ConsentValue>(EMPTY_CONSENT);
  const [consentTouched, setConsentTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const nameIsValid = registerValidation.name.test(name);
  const emailIsValid = registerValidation.email.test(email);
  const phoneIsValid = registerValidation.phone.test(phone);
  const passwordRules = getPasswordRules(password);
  const passwordIsValid = Object.values(passwordRules).every(Boolean);

  const fieldClass = (hasError: boolean) =>
    `flex h-12 items-center gap-3 rounded-xl bg-[#eef2ff] px-4 transition focus-within:ring-2 focus-within:ring-[#6868e8]/30 xl:h-9 xl:gap-2 xl:rounded-lg xl:px-3 ${
      hasError ? "ring-2 ring-red-500" : ""
    }`;
  const inputClass =
    "min-w-0 flex-1 bg-transparent text-sm text-[#17243d] outline-none placeholder:text-[#8e92a3]";
  const requirementClass = (isMet: boolean, hasFinished: boolean) =>
    isMet ? "text-emerald-600" : hasFinished ? "text-red-600" : "text-[#858895]";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({ name: true, email: true, phone: true, password: true });
    setConsentTouched(true);
    setSubmitError("");

    if (!nameIsValid || !emailIsValid || !phoneIsValid || !passwordIsValid || !consentsAccepted(consent)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await registerUser({
        full_name: name,
        nickname: null,
        email,
        phone_number: `+57${phone}`,
        password,
        ...consentPayload(),
      });
      if (!response) {
        throw new Error("El servidor no devolvió los datos de autenticación.");
      }
      sessionStorage.setItem("registrationPhone", phone);
      router.push(response.registration_complete ? "/" : "/complete-profile");
    } catch (error) {
      setSubmitError(
        isConsentVersionOutdated(error)
          ? CONSENT_OUTDATED_MESSAGE
          : error instanceof Error
            ? error.message
            : "No fue posible crear la cuenta.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    showPassword,
    setShowPassword,
    name,
    setName,
    email,
    setEmail,
    phone,
    setPhone,
    password,
    setPassword,
    touched,
    setTouched,
    consent,
    setConsent,
    consentTouched,
    isSubmitting,
    submitError,
    passwordRules,
    nameIsValid,
    emailIsValid,
    phoneIsValid,
    passwordIsValid,
    fieldClass,
    inputClass,
    requirementClass,
    handleSubmit,
  };
}

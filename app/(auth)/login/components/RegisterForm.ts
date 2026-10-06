import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AUTH_ENDPOINTS, postAuthRequest } from "@/lib/auth-api";

const registerValidation = {
  name: /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]{1,50}$/,
  email: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
  phone: /^3[0-9]{9}$/,
  password: {
    length: (value: string) => value.length >= 8,
    uppercase: (value: string) => /[A-Z]/.test(value),
    symbol: (value: string) => /[^A-Za-z0-9]/.test(value),
  },
} as const;

function getPasswordRules(value: string) {
  return {
    length: registerValidation.password.length(value),
    uppercase: registerValidation.password.uppercase(value),
    symbol: registerValidation.password.symbol(value),
  };
}

function sendRegisterRequest(payload: {
  name: string;
  email: string;
  phone: string;
  password: string;
  phoneVerified: boolean;
}) {
  return postAuthRequest(AUTH_ENDPOINTS.register, payload);
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
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
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

  const openVerification = () => {
    if (!phone.trim()) {
      return;
    }

    setVerificationCode("");
    setIsVerificationOpen(true);
  };

  const verifyPhone = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (verificationCode.length === 6) {
      setIsPhoneVerified(true);
      setIsVerificationOpen(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({ name: true, email: true, phone: true, password: true });
    setSubmitError("");

    if (!nameIsValid || !emailIsValid || !phoneIsValid || !passwordIsValid) {
      return;
    }

    setIsSubmitting(true);
    try {
      await sendRegisterRequest({
        name,
        email,
        phone,
        password,
        phoneVerified: isPhoneVerified,
      });
      router.push("/");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No fue posible crear la cuenta.");
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
    verificationCode,
    setVerificationCode,
    isVerificationOpen,
    setIsVerificationOpen,
    isPhoneVerified,
    setIsPhoneVerified,
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
    openVerification,
    verifyPhone,
    handleSubmit,
  };
}

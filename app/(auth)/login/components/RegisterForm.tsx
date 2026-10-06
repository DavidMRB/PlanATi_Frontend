import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  UserRound,
  X,
} from "lucide-react";
import { useState, type FormEvent } from "react";

type RegisterFormProps = {
  onLoginClick: () => void;
};

export default function RegisterForm({ onLoginClick }: RegisterFormProps) {
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
  const nameIsValid = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]{1,50}$/.test(name);
  const emailIsValid = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
  const phoneIsValid = /^3[0-9]{9}$/.test(phone);
  const passwordRules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
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

  return (
    <>
      <form
        className="mt-8 space-y-5 xl:mt-5 xl:space-y-3"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="block space-y-2 xl:space-y-1">
          <span className="flex items-center justify-between text-sm font-semibold text-[#26344d]">
            <span>Nombre completo</span>
            <span className="text-xs font-normal text-[#6d6e7a]">Requerido</span>
          </span>
          <span className={fieldClass(touched.name && !nameIsValid)}>
            <UserRound aria-hidden="true" className="size-5 text-[#81869a] xl:size-4" />
            <input
              required
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onBlur={() => setTouched((current) => ({ ...current, name: true }))}
              maxLength={50}
              pattern="[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]{1,50}"
              title="Usa únicamente letras y espacios, con un máximo de 50 caracteres"
              placeholder="Tu nombre"
              className={inputClass}
            />
          </span>
        </label>

        <label className="block space-y-2 xl:space-y-1">
          <span className="flex items-center justify-between text-sm font-semibold text-[#26344d]">
            <span>Correo electrónico</span>
            <span className="text-xs font-normal text-[#6d6e7a]">Requerido</span>
          </span>
          <span className={fieldClass(touched.email && !emailIsValid)}>
            <Mail aria-hidden="true" className="size-5 text-[#81869a] xl:size-4" />
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() => setTouched((current) => ({ ...current, email: true }))}
              pattern="[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"
              title="Ingresa un correo válido, por ejemplo tu.nombre@ejemplo.com"
              placeholder="tu.nombre@ejemplo.com"
              className={inputClass}
            />
          </span>
        </label>

        <label className="block space-y-2 xl:space-y-1">
          <span className="flex items-center justify-between text-sm font-semibold text-[#26344d]">
            <span>Número de teléfono</span>
            <span className="text-xs font-normal text-[#6d6e7a]">Requerido</span>
          </span>
          <span className={fieldClass(touched.phone && !phoneIsValid)}>
            <Phone aria-hidden="true" className="size-5 text-[#81869a] xl:size-4" />
            <input
              required
              type="tel"
              inputMode="numeric"
              maxLength={10}
              pattern="3[0-9]{9}"
              title="Ingresa un número celular colombiano de 10 dígitos que empiece por 3"
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value.replace(/\D/g, "").slice(0, 10));
                setIsPhoneVerified(false);
              }}
              onBlur={() => setTouched((current) => ({ ...current, phone: true }))}
              placeholder="3000000000"
              className={inputClass}
            />
            <button
              type="button"
              onClick={openVerification}
              disabled={!phone.trim() || isPhoneVerified}
              className="shrink-0 text-xs font-bold text-[#4c4cdd] transition hover:text-[#3633bd] disabled:cursor-not-allowed disabled:text-[#9b9dad]"
            >
              {isPhoneVerified ? (
                <span className="flex items-center gap-1 text-[#168c83]">
                  <Check aria-hidden="true" className="size-4" />
                  Verificado
                </span>
              ) : (
                "Verificar"
              )}
            </button>
          </span>
        </label>

        <label className="block space-y-2 xl:space-y-1">
          <span className="flex items-center justify-between text-sm font-semibold text-[#26344d]">
            <span>Contraseña</span>
            <span className="text-xs font-normal text-[#6d6e7a]">Requerido</span>
          </span>
          <span className={fieldClass(touched.password && !passwordIsValid)}>
            <LockKeyhole aria-hidden="true" className="size-5 text-[#81869a] xl:size-4" />
            <input
              required
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onBlur={() => setTouched((current) => ({ ...current, password: true }))}
              minLength={8}
              pattern="(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}"
              title="Debe tener al menos 8 caracteres, una letra mayúscula y un símbolo especial"
              placeholder="••••••••••••"
              className={inputClass}
            />
            <button type="button" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setShowPassword((visible) => !visible)} className="text-[#81869a] transition hover:text-[#4c4cdd]">
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </span>
          <ul className="mt-2 space-y-1 text-xs xl:mt-3" aria-label="Requisitos de contraseña">
            <li className={requirementClass(passwordRules.length, touched.password)}>
              {passwordRules.length ? "✓" : "•"} Mínimo 8 caracteres
            </li>
            <li className={requirementClass(passwordRules.uppercase, touched.password)}>
              {passwordRules.uppercase ? "✓" : "•"} Una letra mayúscula
            </li>
            <li className={requirementClass(passwordRules.symbol, touched.password)}>
              {passwordRules.symbol ? "✓" : "•"} Un símbolo especial
            </li>
          </ul>
        </label>

        <button type="submit" className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#514ddd] text-base font-bold text-white shadow-[0_8px_18px_rgba(81,77,221,0.24)] transition hover:bg-[#4542ca] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4c4cdd] xl:mt-3 xl:h-9 xl:rounded-lg xl:text-xs">
          Crear mi cuenta
          <ArrowRight aria-hidden="true" className="size-5 xl:size-4" />
        </button>

        <p className="rounded-xl bg-[#eef2ff] px-4 py-4 text-center text-sm text-[#676a79] xl:rounded-lg xl:py-3 xl:text-xs">
          ¿Ya tienes cuenta?{" "}
          <button type="button" onClick={onLoginClick} className="font-bold text-[#168c83] hover:underline">
            Inicia sesión ↗
          </button>
        </p>
      </form>

      {isVerificationOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#17243d]/45 px-5 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsVerificationOpen(false);
            }
          }}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="verification-title" className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-[#17243d] shadow-[0_24px_70px_rgba(38,47,99,0.24)]">
            <button type="button" aria-label="Cerrar verificación" onClick={() => setIsVerificationOpen(false)} className="absolute right-4 top-4 rounded-full p-1 text-[#81869a] transition hover:bg-[#eef2ff] hover:text-[#4c4cdd]">
              <X aria-hidden="true" className="size-5" />
            </button>
            <div className="pr-6">
              <h2 id="verification-title" className="text-lg font-bold">Verifica tu número</h2>
              <p className="mt-2 text-sm leading-5 text-[#676a79]">Ingresa los 6 dígitos que enviamos por SMS al número registrado.</p>
            </div>
            <form onSubmit={verifyPhone} className="mt-5 space-y-4">
              <input
                autoFocus
                required
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                aria-label="Código de verificación de 6 dígitos"
                className="h-14 w-full rounded-xl bg-[#eef2ff] text-center text-2xl font-bold tracking-[0.45em] text-[#17243d] outline-none transition focus:ring-2 focus:ring-[#6868e8]/30"
              />
              <button type="submit" disabled={verificationCode.length !== 6} className="h-11 w-full rounded-xl bg-[#514ddd] text-sm font-bold text-white transition hover:bg-[#4542ca] disabled:cursor-not-allowed disabled:opacity-50">
                Confirmar número
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

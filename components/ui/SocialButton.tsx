import type { ReactNode } from "react";

type SocialButtonProps = {
  children: ReactNode;
  provider: "google" | "facebook";
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
};

export default function SocialButton({
  children,
  provider,
  href,
  onClick,
  disabled = false,
}: SocialButtonProps) {
  const className =
    "flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#e6e9f4] bg-white px-4 text-sm font-semibold text-[#293650] transition hover:border-[#c9cdf4] hover:bg-[#f8f8ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4c4cdd] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1";
  const content = (
    <>
      <span
        aria-hidden="true"
        className={
          provider === "google"
            ? "text-lg font-bold text-[#4285f4]"
            : "flex size-5 items-center justify-center rounded-full bg-[#1877f2] text-sm font-bold text-white"
        }
      >
        {provider === "google" ? "G" : "f"}
      </span>
      {children}
    </>
  );

  if (href) {
    return (
      <a className={className} href={href} onClick={onClick}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" className={className} onClick={onClick} disabled={disabled}>
      {content}
    </button>
  );
}
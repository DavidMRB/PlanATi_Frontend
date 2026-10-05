import type { ReactNode } from "react";

type SocialButtonProps = {
  children: ReactNode;
  provider: "google" | "facebook";
};

export default function SocialButton({
  children,
  provider,
}: SocialButtonProps) {
  return (
    <button
      type="button"
      className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#e6e9f4] bg-white px-4 text-sm font-semibold text-[#293650] transition hover:border-[#c9cdf4] hover:bg-[#f8f8ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4c4cdd] sm:flex-1"
    >
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
    </button>
  );
}
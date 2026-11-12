import type { UserProfile } from "@/lib/auth-api";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

type AvatarProps = {
  user: Pick<UserProfile, "full_name" | "picture">;
  className?: string;
};

// Foto de perfil o, si no hay, las iniciales del nombre.
export default function Avatar({ user, className = "size-9" }: AvatarProps) {
  if (user.picture) {
    return (
      // Sin Referer: lh3.googleusercontent.com responde 429 a las fotos de Google cuando llega con Referer.
      // eslint-disable-next-line @next/next/no-img-element -- URLs de R2 o Google
      <img src={user.picture} alt="" referrerPolicy="no-referrer" className={`shrink-0 rounded-full object-cover ${className}`} />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#6d69ea] text-xs font-bold text-white ${className}`}
    >
      {initials(user.full_name) || "?"}
    </span>
  );
}

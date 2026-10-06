"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

type Profile = {
  phone?: string | null;
  username?: string | null;
  profileImage?: string | null;
  user?: Profile;
};

const PROFILE_ENDPOINT = `${API_URL}/users/me`;

export default function GoogleCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const validateProfile = async () => {
      try {
        const response = await fetch(PROFILE_ENDPOINT, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          throw new Error(`No fue posible consultar el perfil (${response.status}).`);
        }

        const responseData = (await response.json()) as Profile;
        const profile = responseData.user ?? responseData;
        const hasMissingData =
          !profile.phone?.trim() ||
          !profile.username?.trim() ||
          !profile.profileImage?.trim();

        router.replace(hasMissingData ? "/complete-profile" : "/");
      } catch (validationError) {
        setError(
          validationError instanceof Error
            ? validationError.message
            : "No fue posible validar tu perfil.",
        );
      }
    };

    void validateProfile();
  }, [router]);

  if (error) {
    return <p>{error}</p>;
  }

  return <p>Validando tu perfil...</p>;
}

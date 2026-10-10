"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { getAuthHeaders, saveAuthSession } from "@/lib/auth-api";

type Profile = {
  phone_number?: string | null;
  nickname?: string | null;
  picture?: string | null;
  user?: Profile;
};

const PROFILE_ENDPOINT = `${API_URL}/users/me`;

export default function GoogleCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const validateProfile = async () => {
      try {
        const query = new URLSearchParams(window.location.search);
        const accessToken = query.get("access_token");
        const registrationComplete = query.get("registration_complete");
        const requiresPhoneVerification = query.get("requires_phone_verification");

        if (accessToken) {
          saveAuthSession({
            access_token: accessToken,
            registration_complete: registrationComplete === "true",
            requires_phone_verification: requiresPhoneVerification === "true",
          });
        }

        const response = await fetch(PROFILE_ENDPOINT, {
          credentials: "include",
          headers: { Accept: "application/json", ...getAuthHeaders() },
        });

        if (!response.ok) {
          throw new Error(`No fue posible consultar el perfil (${response.status}).`);
        }

        const responseData = (await response.json()) as Profile;
        const profile = responseData.user ?? responseData;
        const hasMissingData =
          !profile.phone_number?.trim() ||
          !profile.nickname?.trim() ||
          !profile.picture?.trim();

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

}

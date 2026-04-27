"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type GoogleSignInButtonProps = {
  callbackUrl: string;
};

export function GoogleSignInButton({ callbackUrl }: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const csrfResponse = await fetch("/api/auth/csrf", {
        method: "GET",
        credentials: "include",
      });
      if (!csrfResponse.ok) {
        setLoading(false);
        return;
      }
      const csrfData = (await csrfResponse.json()) as { csrfToken: string };
      const body = new URLSearchParams({
        csrfToken: csrfData.csrfToken,
        callbackUrl,
        json: "true",
      });
      const signInResponse = await fetch("/api/auth/signin/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        credentials: "include",
        body: body.toString(),
      });
      if (!signInResponse.ok) {
        setLoading(false);
        return;
      }
      const data = (await signInResponse.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  return (
    <Button className="w-full" onClick={() => void handleSignIn()} disabled={loading}>
      {loading ? "Redirecting..." : "Continue with Google"}
    </Button>
  );
}

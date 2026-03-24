"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

type AdminLoginFormProps = {
  buttonLabel?: string;
};
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

type AdminLoginFormProps = {
  buttonLabel?: string;
};

export function AdminLoginForm({
  buttonLabel = "Google でサインイン"
}: AdminLoginFormProps) {
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignIn() {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/admin",
        errorCallbackURL: "/admin/login"
      });

      if (result.error) {
        setErrorMessage(result.error.message ?? "サインインできませんでした。");
        return;
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-5 space-y-4">
      {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}

      <button
        className="mx-auto block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={isSubmitting}
        onClick={() => {
          void handleSignIn();
        }}
        type="button"
      >
        {isSubmitting ? "リダイレクト中..." : buttonLabel}
      </button>
    </div>
  );
}

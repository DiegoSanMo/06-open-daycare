"use client";

import { useState, type FormEvent } from "react";

import type { InvitationPreview } from "@/app/_actions/invitations";
import { createClient } from "@/utils/supabase/client";

type FormState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "error"; message: string };

const consentLabel =
  "Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de la app.";

const inputClassName =
  "w-full rounded-[14px] border-[1.5px] bg-white px-4 py-[14px] text-[15px] text-ink placeholder:text-field-placeholder focus:outline-none";

const labelClassName =
  "mb-2 block text-[12px] font-bold tracking-[0.7px] text-muted";

function toSpanishError(message: string): string {
  if (/invalid or expired invitation code/i.test(message)) {
    return "El código de invitación no es válido o venció.";
  }
  if (/already registered/i.test(message)) {
    return "Ya existe una cuenta con este email. Iniciá sesión.";
  }
  if (/password/i.test(message)) {
    return "La contraseña no cumple con los requisitos. Probá con otra.";
  }
  return "No se pudo activar la cuenta. Intentá nuevamente.";
}

export function ActivateAccountForm({
  invitation,
}: {
  invitation: InvitationPreview;
}) {
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<FormState>({ status: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 6) {
      setState({
        status: "error",
        message: "La contraseña debe tener al menos 6 caracteres.",
      });
      return;
    }
    if (!consent) {
      setState({
        status: "error",
        message: "Debés autorizar el uso de fotos para continuar.",
      });
      return;
    }

    setState({ status: "submitting" });

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: { data: { invitation_code: invitation.code } },
      });

      if (error) {
        setState({ status: "error", message: toSpanishError(error.message) });
        return;
      }
    } catch {
      setState({
        status: "error",
        message: "No se pudo activar la cuenta. Intentá nuevamente.",
      });
      return;
    }

    // Full navigation so the proxy runs with the freshly written auth cookies.
    window.location.assign(new URL("/login", window.location.origin).toString());
  }

  const childInitial = invitation.childName.charAt(0).toUpperCase();
  const childLabel = `${invitation.childName} · Sala ${invitation.roomName}`;

  return (
    <form noValidate onSubmit={handleSubmit}>
      <div className="mb-[22px] flex items-center gap-[14px] rounded-[16px] border-[1.5px] border-field-border bg-white p-[14px_16px]">
        <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#A9D9E8] font-display text-[19px] font-semibold text-[#1F7A93]">
          {childInitial}
        </div>
        <div>
          <div className="text-[13px] text-muted">Te invitaron a seguir a</div>
          <div className="font-display text-[17px] font-semibold text-ink">
            {childLabel}
          </div>
        </div>
      </div>

      <label htmlFor="invite-code" className={labelClassName}>
        CÓDIGO DE INVITACIÓN
      </label>
      <input
        className={`mb-[18px] border-field-border bg-surface font-display text-[18px] font-bold tracking-[3px] ${inputClassName}`}
        id="invite-code"
        name="code"
        readOnly
        value={invitation.code}
      />

      <label htmlFor="activation-email" className={labelClassName}>
        EMAIL
      </label>
      <input
        className={`mb-[18px] border-field-border bg-surface ${inputClassName}`}
        id="activation-email"
        name="email"
        readOnly
        type="email"
        value={invitation.email}
      />

      <label htmlFor="activation-password" className={labelClassName}>
        CREAR CONTRASEÑA
      </label>
      <input
        autoComplete="new-password"
        className={`mb-[18px] border-[#F2A78E] ${inputClassName}`}
        id="activation-password"
        name="password"
        onChange={(event) => setPassword(event.target.value)}
        placeholder="••••••••"
        type="password"
        value={password}
      />

      <label className="mb-6 flex cursor-pointer items-start gap-[12px] rounded-[14px] bg-[#FBF1D6] p-[14px_16px]">
        <input
          aria-label={consentLabel}
          checked={consent}
          className="peer sr-only"
          onChange={(event) => setConsent(event.target.checked)}
          type="checkbox"
        />
        <span
          className={`mt-[1px] flex h-6 w-6 flex-none items-center justify-center rounded-[8px] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#5FB97E] ${
            consent ? "bg-[#5FB97E]" : "border-[1.5px] border-[#C9B27A] bg-white"
          }`}
        >
          {consent ? (
            <svg
              className="text-white"
              fill="none"
              height="15"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              viewBox="0 0 24 24"
              width="15"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : null}
        </span>
        <span className="text-[14px] leading-[1.45] text-[#8A7234]">
          {consentLabel}
        </span>
      </label>

      {state.status === "error" ? (
        <p
          className="mb-4 rounded-[12px] border border-line bg-surface px-4 py-3 text-[13.5px] font-bold text-[#D9583C]"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}

      <button
        className="block w-full cursor-pointer rounded-[15px] bg-linear-[180deg,#F4977E,#EE8164] px-[15px] py-[15px] text-center text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={state.status === "submitting"}
        type="submit"
      >
        {state.status === "submitting" ? "Activando…" : "Activar mi cuenta"}
      </button>
    </form>
  );
}

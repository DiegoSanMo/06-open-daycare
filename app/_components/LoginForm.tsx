"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";

import { createClient } from "@/utils/supabase/client";

type LoginFormState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "error"; message: string };

function toSpanishError(message: string) {
  if (/invalid login credentials/i.test(message)) {
    return "Email o contraseña incorrectos.";
  }
  return "No se pudo iniciar sesión. Intentá nuevamente.";
}

export function LoginForm() {
  const router = useRouter();
  const errorId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<LoginFormState>({ status: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.status === "submitting") return;
    setState({ status: "submitting" });

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setState({ status: "error", message: toSpanishError(error.message) });
        return;
      }
    } catch {
      setState({
        status: "error",
        message: "No se pudo iniciar sesión. Intentá nuevamente.",
      });
      return;
    }

    // The RSC request from a client navigation still goes through the proxy
    // with the fresh auth cookies; refresh() drops any signed-out cached payload.
    router.replace("/");
    router.refresh();
  }

  function clearError() {
    if (state.status === "error") {
      setState({ status: "idle" });
    }
  }

  // Colors below meet WCAG 2.2 AA against the auth background (#fbf4ec)
  // and the white input surface.
  const mutedTextClass = "text-[#6b6054]";
  const accentTextClass = "text-[#ad3f2b]";
  const fieldBorderClass = "border-[#94887b]";
  const focusRingClass =
    "focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

  return (
    <div className="w-full max-w-[392px]">
      <h2 className="mb-[6px] font-display text-[30px] font-semibold text-ink">
        Iniciar sesión
      </h2>
      <p className={`mb-7 text-[15px] ${mutedTextClass}`}>
        Ingresá para ver el día de hoy.
      </p>

      <form onSubmit={handleSubmit}>
        <label
          htmlFor="login-email"
          className={`mb-2 block text-[12px] font-bold tracking-[0.7px] ${mutedTextClass}`}
        >
          EMAIL
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="correo@ejemplo.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            clearError();
          }}
          disabled={state.status === "submitting"}
          aria-describedby={state.status === "error" ? errorId : undefined}
          className={`mb-[18px] w-full rounded-[14px] border-[1.5px] ${fieldBorderClass} bg-white px-4 py-[14px] text-[15px] text-ink placeholder:text-field-placeholder ${focusRingClass}`}
        />

        <label
          htmlFor="login-password"
          className={`mb-2 block text-[12px] font-bold tracking-[0.7px] ${mutedTextClass}`}
        >
          CONTRASEÑA
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            clearError();
          }}
          disabled={state.status === "submitting"}
          aria-describedby={state.status === "error" ? errorId : undefined}
          className={`mb-[10px] w-full rounded-[14px] border-[1.5px] ${fieldBorderClass} bg-white px-4 py-[14px] text-[15px] text-ink placeholder:text-field-placeholder ${focusRingClass}`}
        />

        {state.status === "error" ? (
          <p
            id={errorId}
            role="alert"
            className={`mb-4 text-[13.5px] font-bold ${accentTextClass}`}
          >
            {state.message}
          </p>
        ) : null}

        <div className="mb-5 text-right">
          <button
            type="button"
            disabled
            className={`inline-flex min-h-6 cursor-default items-center border-0 bg-transparent p-0 text-[13.5px] font-bold ${accentTextClass}`}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <button
          type="submit"
          disabled={state.status === "submitting"}
          className={`block w-full cursor-pointer rounded-[15px] bg-linear-[180deg,#B94D30,#A4402A] px-[15px] py-[15px] text-center text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(180,68,44,0.7)] disabled:cursor-not-allowed disabled:opacity-70 ${focusRingClass}`}
        >
          {state.status === "submitting" ? "Ingresando…" : "Iniciar sesión"}
        </button>
      </form>

      <p className={`mt-6 text-center text-[14.5px] ${mutedTextClass}`}>
        ¿Te invitó la guardería?{" "}
        <Link
          href="/activate-account"
          className={`font-extrabold ${accentTextClass} ${focusRingClass}`}
        >
          Activá tu cuenta
        </Link>
      </p>
    </div>
  );
}

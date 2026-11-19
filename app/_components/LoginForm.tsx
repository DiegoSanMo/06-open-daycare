"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<LoginFormState>({ status: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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

    // Full navigation re-runs the proxy with the freshly written auth cookies.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/");
  }

  return (
    <div className="w-full max-w-[392px]">
      <h2 className="mb-[6px] font-display text-[30px] font-semibold text-ink">
        Iniciar sesión
      </h2>
      <p className="mb-7 text-[15px] text-muted">
        Ingresá para ver el día de hoy.
      </p>

      <form onSubmit={handleSubmit}>
        <label
          htmlFor="login-email"
          className="mb-2 block text-[12px] font-bold tracking-[0.7px] text-muted"
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
          onChange={(event) => setEmail(event.target.value)}
          className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-field-border bg-white px-4 py-[14px] text-[15px] text-ink placeholder:text-field-placeholder focus:outline-none"
        />

        <label
          htmlFor="login-password"
          className="mb-2 block text-[12px] font-bold tracking-[0.7px] text-muted"
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
          onChange={(event) => setPassword(event.target.value)}
          className="mb-[10px] w-full rounded-[14px] border-[1.5px] border-field-border bg-white px-4 py-[14px] text-[15px] text-ink placeholder:text-field-placeholder focus:outline-none"
        />

        {state.status === "error" ? (
          <p role="alert" className="mb-4 text-[13.5px] font-bold text-[#D9583C]">
            {state.message}
          </p>
        ) : null}

        <div className="mb-5 text-right">
          <span
            aria-disabled="true"
            className="text-[13.5px] font-bold text-brand-strong"
          >
            ¿Olvidaste tu contraseña?
          </span>
        </div>

        <button
          type="submit"
          disabled={state.status === "submitting"}
          className="block w-full cursor-pointer rounded-[15px] bg-linear-[180deg,#F4977E,#EE8164] px-[15px] py-[15px] text-center text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {state.status === "submitting" ? "Ingresando…" : "Iniciar sesión"}
        </button>
      </form>

      <p className="mt-6 text-center text-[14.5px] text-muted">
        ¿Te invitó la guardería?{" "}
        <Link
          href="/activate-account"
          className="font-extrabold text-brand-strong"
        >
          Activá tu cuenta
        </Link>
      </p>
    </div>
  );
}

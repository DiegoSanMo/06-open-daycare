import Link from "next/link";

import { activationFixture } from "../_data/auth";

const inputClassName =
  "w-full rounded-[14px] border-[1.5px] bg-white px-4 py-[14px] text-[15px] text-ink placeholder:text-field-placeholder focus:outline-none";

const labelClassName =
  "mb-2 block text-[12px] font-bold tracking-[0.7px] text-muted";

export default function ActivateAccountPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-auth-bg p-10">
      <div className="w-full max-w-[440px]">
        <div className="mb-[22px] flex h-[58px] w-[58px] items-center justify-center rounded-[18px] bg-linear-[155deg,#F8C3A8,#F2937A] shadow-[0_12px_26px_-10px_rgba(238,129,100,0.65)]">
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        </div>

        <h1 className="mb-2 font-display text-[32px] font-semibold leading-[1.15] text-ink">
          Bienvenida a OpenDayCare
        </h1>
        <p className="mb-[26px] text-[15.5px] leading-[1.55] text-muted">
          Te invitaron a seguir el día de tu hijo. Creá tu contraseña para activar
          la cuenta.
        </p>

        <div className="mb-[22px] flex items-center gap-[14px] rounded-[16px] border-[1.5px] border-field-border bg-white p-[14px_16px]">
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#A9D9E8] font-display text-[19px] font-semibold text-[#1F7A93]">
            {activationFixture.childInitial}
          </div>
          <div>
            <div className="text-[13px] text-muted">
              {activationFixture.invitationLabel}
            </div>
            <div className="font-display text-[17px] font-semibold text-ink">
              {activationFixture.childLabel}
            </div>
          </div>
        </div>

        <label htmlFor="invite-code" className={labelClassName}>
          CÓDIGO DE INVITACIÓN
        </label>
        <input
          id="invite-code"
          defaultValue={activationFixture.inviteCode}
          className={`mb-[18px] border-field-border font-display text-[18px] font-bold tracking-[3px] ${inputClassName}`}
        />

        <label htmlFor="activation-email" className={labelClassName}>
          EMAIL
        </label>
        <input
          id="activation-email"
          type="email"
          defaultValue={activationFixture.email}
          className={`mb-[18px] border-field-border ${inputClassName}`}
        />

        <label htmlFor="activation-password" className={labelClassName}>
          CREAR CONTRASEÑA
        </label>
        <input
          id="activation-password"
          type="password"
          defaultValue={activationFixture.password}
          className={`mb-[18px] border-[#F2A78E] ${inputClassName}`}
        />

        <label className="mb-6 flex cursor-pointer items-start gap-[12px] rounded-[14px] bg-[#FBF1D6] p-[14px_16px]">
          <input
            type="checkbox"
            defaultChecked
            readOnly
            aria-label={activationFixture.consentLabel}
            className="peer sr-only"
          />
          <span className="mt-[1px] flex h-6 w-6 flex-none items-center justify-center rounded-[8px] bg-[#5FB97E] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#5FB97E]">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <span className="text-[14px] leading-[1.45] text-[#8A7234]">
            {activationFixture.consentLabel}
          </span>
        </label>

        <a
          aria-disabled="true"
          className="block w-full rounded-[15px] bg-linear-[180deg,#F4977E,#EE8164] px-[15px] py-[15px] text-center text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)]"
        >
          Activar mi cuenta
        </a>

        <p className="mt-[22px] text-center text-[14.5px] text-muted">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-extrabold text-brand-strong">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

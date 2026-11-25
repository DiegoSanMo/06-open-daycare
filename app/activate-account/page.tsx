import Link from "next/link";
import { Suspense } from "react";

import { getInvitationPreview } from "../_actions/invitations";
import { ActivateAccountForm } from "../_components/ActivateAccountForm";

function ActivateAccountFallback() {
  return (
    <div>
      <div className="mb-[22px] h-[76px] rounded-[16px] bg-[#E7DAC8]/60" />
      <div className="mb-2 h-3 w-36 rounded bg-[#E7DAC8]/60" />
      <div className="mb-[18px] h-[52px] rounded-[14px] bg-[#E7DAC8]/60" />
      <div className="mb-2 h-3 w-20 rounded bg-[#E7DAC8]/60" />
      <div className="mb-[18px] h-[52px] rounded-[14px] bg-[#E7DAC8]/60" />
      <div className="mb-2 h-3 w-32 rounded bg-[#E7DAC8]/60" />
      <div className="mb-[18px] h-[52px] rounded-[14px] bg-[#E7DAC8]/60" />
      <div className="mb-6 h-[70px] rounded-[14px] bg-[#E7DAC8]/60" />
      <div className="h-[52px] rounded-[15px] bg-[#E7DAC8]/60" />
    </div>
  );
}

function InvalidInvitation() {
  return (
    <div>
      <p
        className="mb-[18px] rounded-[14px] border border-line bg-surface px-4 py-[14px] text-[13.5px] font-bold text-[#D9583C]"
        role="alert"
      >
        El código de invitación no es válido o venció.
      </p>
      <button
        aria-disabled="true"
        className="block w-full cursor-not-allowed rounded-[15px] bg-linear-[180deg,#F4977E,#EE8164] px-[15px] py-[15px] text-center text-[16px] font-extrabold text-white opacity-60"
        disabled
        type="button"
      >
        Activar mi cuenta
      </button>
    </div>
  );
}

async function ActivateAccountContent({
  searchParams,
}: Pick<PageProps<"/activate-account">, "searchParams">) {
  const params = await searchParams;
  const code = typeof params.code === "string" ? params.code : "";
  const email = typeof params.email === "string" ? params.email.trim().toLowerCase() : "";

  const invitation = await getInvitationPreview(code);

  if (!invitation || (email && email !== invitation.email.trim().toLowerCase())) {
    return <InvalidInvitation />;
  }

  return <ActivateAccountForm invitation={invitation} />;
}

export default function ActivateAccountPage({
  searchParams,
}: PageProps<"/activate-account">) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-auth-bg p-10">
      <div className="w-full max-w-[440px]">
        <div className="mb-[22px] flex h-[58px] w-[58px] items-center justify-center rounded-[18px] bg-linear-[155deg,#F8C3A8,#F2937A] shadow-[0_12px_26px_-10px_rgba(238,129,100,0.65)]">
          <svg
            className="text-white"
            fill="none"
            height="30"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.2"
            viewBox="0 0 24 24"
            width="30"
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

        <Suspense fallback={<ActivateAccountFallback />}>
          <ActivateAccountContent searchParams={searchParams} />
        </Suspense>

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

"use client";

import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  createInvitation,
  resendInvitation,
  type InvitationState,
} from "@/app/_actions/invitations";
import {
  parentRelationOptions,
  type LinkParentFormValues,
  type ParentRelation,
} from "@/app/_data/kids";

type LinkParentModalProps = {
  open: boolean;
  onClose: () => void;
  kidName: string;
  childId?: string;
};

type FormErrors = Partial<Record<keyof LinkParentFormValues, string>>;

const initialState: InvitationState = { status: "idle" };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function emptyValues(): LinkParentFormValues {
  return {
    parentName: "",
    email: "",
    relation: parentRelationOptions[0],
  };
}

function expiryLabel(expiresAt: string): string {
  const timestamp = new Date(expiresAt).getTime();
  if (!Number.isFinite(timestamp)) return "Vence pronto";

  const days = Math.max(1, Math.ceil((timestamp - Date.now()) / MS_PER_DAY));
  return `Vence en ${days} ${days === 1 ? "día" : "días"}`;
}

export function LinkParentModal({
  open,
  onClose,
  kidName,
  childId,
}: LinkParentModalProps) {
  const [state, formAction, pending] = useActionState(
    createInvitation,
    initialState,
  );
  const [resendState, resendFormAction, resendPending] = useActionState(
    resendInvitation,
    initialState,
  );
  const [values, setValues] = useState<LinkParentFormValues>(emptyValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const dialogRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const handleClose = useCallback(() => {
    setValues(emptyValues());
    setErrors({});
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    nameInputRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocusedRef.current?.focus();
    };
  }, [open, handleClose]);

  if (!open) return null;

  const firstName = kidName.split(" ")[0];
  const sentState = state.status === "sent" ? state : null;
  const resendSentState = resendState.status === "sent" ? resendState : null;
  const confirmation = sentState ?? resendSentState;
  const serverError = state.status === "error" ? state.message : null;
  const deliveryError = resendState.status === "error"
    ? resendState.message
    : (resendSentState?.resendError ?? sentState?.resendError ?? null);

  function updateValue<K extends keyof LinkParentFormValues>(
    field: K,
    value: LinkParentFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};
    if (!values.parentName.trim()) {
      nextErrors.parentName = "Ingresá el nombre del padre/madre.";
    }
    if (!values.email.trim()) {
      nextErrors.email = "Ingresá el email.";
    } else if (!emailPattern.test(values.email.trim())) {
      nextErrors.email = "El email no es válido.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
  }

  function handleResend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      resendFormAction(formData);
    });
  }

  const fieldBaseClass =
    "w-full rounded-[14px] border-[1.5px] bg-white px-4 py-[13px] text-[15px] text-ink placeholder:text-field-placeholder";
  const labelClass =
    "mb-2 block text-[12px] font-extrabold tracking-[0.7px] text-muted";
  const focusRingClass =
    "focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
  const codeCardClass =
    "mb-5 rounded-[16px] border-[1.5px] border-dashed border-[#E6D08A] bg-[#FBF1D6] p-[18px] text-center";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(63,54,46,0.45)] px-6 py-10"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <div
        aria-describedby="link-parent-notice"
        aria-labelledby="link-parent-title"
        aria-modal="true"
        className="w-full max-w-[480px] overflow-hidden rounded-[24px] border border-line bg-auth-bg shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)]"
        ref={dialogRef}
        role="dialog"
      >
        <div className="flex items-center justify-between border-b border-line px-[26px] py-5">
          <div className="min-w-0">
            <h2
              className="font-display text-[18px] font-semibold text-ink"
              id="link-parent-title"
            >
              Vincular padre
            </h2>
            <p className="truncate text-[13px] text-muted-soft">a {kidName}</p>
          </div>
          <button
            aria-label="Cerrar"
            className={`flex h-[34px] w-[34px] flex-none cursor-pointer items-center justify-center rounded-[10px] bg-[#F0E6D8] text-[#94887B] ${focusRingClass}`}
            onClick={handleClose}
            type="button"
          >
            <svg
              fill="none"
              height="18"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.2"
              viewBox="0 0 24 24"
              width="18"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {confirmation ? (
          <div className="px-[26px] py-[22px]">
            <div className="mb-5 flex gap-[11px] rounded-[14px] bg-[#E6F2E8] px-4 py-[13px]">
              <svg
                className="mt-px flex-none"
                fill="none"
                height="20"
                stroke="#3F8A5A"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="20"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="m8 12 3 3 5-6" />
              </svg>
              <span
                className="text-[13.5px] leading-[1.45] text-[#2F6B45]"
                id="link-parent-notice"
              >
                La invitación quedó guardada. Compartí el código con {firstName}{" "}
                o usá el correo enviado.
              </span>
            </div>

            <div className={codeCardClass}>
              <div className="mb-2 text-[12px] font-extrabold tracking-[0.7px] text-[#A88526]">
                CÓDIGO DE INVITACIÓN
              </div>
              <div className="font-display text-[34px] font-semibold tracking-[7px] text-[#8A7234]">
                {confirmation.code}
              </div>
              <div className="mt-[6px] text-[13px] text-[#A88526]">
                {expiryLabel(confirmation.expiresAt)}
              </div>
            </div>

            {deliveryError ? (
              <p
                className="mb-4 rounded-[12px] border border-line bg-surface px-4 py-3 text-[13px] font-semibold text-brand"
                role="alert"
              >
                {deliveryError}
              </p>
            ) : null}

            {deliveryError ? (
              <form className="mb-3" noValidate onSubmit={handleResend}>
                <input name="code" readOnly type="hidden" value={confirmation.code} />
                <button
                  className={`flex w-full cursor-pointer items-center justify-center gap-[9px] rounded-[14px] border-[1.5px] border-[#9FB8EC] bg-[#CCD8F4] p-[13px] text-[15px] font-extrabold text-[#4E72C8] disabled:cursor-not-allowed disabled:opacity-60 ${focusRingClass}`}
                  disabled={resendPending}
                  type="submit"
                >
                  {resendPending ? "Reenviando…" : "Reenviar correo"}
                </button>
              </form>
            ) : null}

            <button
              className={`flex w-full cursor-pointer items-center justify-center rounded-[14px] bg-[#F0E6D8] p-[13px] text-[15px] font-extrabold text-[#94887B] ${focusRingClass}`}
              onClick={handleClose}
              type="button"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form className="px-[26px] py-[22px]" noValidate onSubmit={handleSubmit}>
            <div className="mb-5 flex gap-[11px] rounded-[14px] bg-[#E3ECFB] px-4 py-[13px]">
              <svg
                className="mt-px flex-none"
                fill="none"
                height="20"
                stroke="#4E72C8"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="20"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <span
                className="text-[13.5px] leading-[1.45] text-[#3F5694]"
                id="link-parent-notice"
              >
                Le enviaremos un correo con un código para que active su cuenta.
                Solo verá el feed de {firstName}.
              </span>
            </div>

            {serverError ? (
              <p
                className="mb-4 rounded-[12px] border border-line bg-surface px-4 py-3 text-[13px] font-semibold text-brand"
                role="alert"
              >
                {serverError}
              </p>
            ) : null}

            <input name="childId" readOnly type="hidden" value={childId ?? ""} />

            <div className="mb-[18px]">
              <label className={labelClass} htmlFor="link-parent-name">
                NOMBRE DEL PADRE/MADRE
              </label>
              <input
                aria-describedby={errors.parentName ? "link-parent-name-error" : undefined}
                aria-invalid={errors.parentName ? true : undefined}
                className={`${fieldBaseClass} ${errors.parentName ? "border-brand" : "border-field-border"} ${focusRingClass}`}
                id="link-parent-name"
                name="fullName"
                onChange={(event) => updateValue("parentName", event.target.value)}
                placeholder="Ej. Diego Fernández"
                ref={nameInputRef}
                type="text"
                value={values.parentName}
              />
              {errors.parentName ? (
                <p
                  className="mt-1.5 text-[12px] font-semibold text-brand"
                  id="link-parent-name-error"
                  role="alert"
                >
                  {errors.parentName}
                </p>
              ) : null}
            </div>

            <div className="mb-[18px]">
              <label className={labelClass} htmlFor="link-parent-email">
                EMAIL
              </label>
              <input
                aria-describedby={errors.email ? "link-parent-email-error" : undefined}
                aria-invalid={errors.email ? true : undefined}
                className={`${fieldBaseClass} ${errors.email ? "border-brand" : "border-field-border"} ${focusRingClass}`}
                id="link-parent-email"
                name="email"
                onChange={(event) => updateValue("email", event.target.value)}
                placeholder="correo@ejemplo.com"
                type="email"
                value={values.email}
              />
              {errors.email ? (
                <p
                  className="mt-1.5 text-[12px] font-semibold text-brand"
                  id="link-parent-email-error"
                  role="alert"
                >
                  {errors.email}
                </p>
              ) : null}
            </div>

            <fieldset className="mb-5">
              <legend className="mb-[10px] block text-[12px] font-extrabold tracking-[0.7px] text-muted">
                PARENTESCO
              </legend>
              <div className="flex gap-[9px]">
                {parentRelationOptions.map((relation: ParentRelation) => (
                  <div className="flex-1" key={relation}>
                    <input
                      checked={values.relation === relation}
                      className="peer sr-only"
                      id={`link-parent-relation-${relation}`}
                      name="relation"
                      onChange={() => updateValue("relation", relation)}
                      type="radio"
                      value={relation}
                    />
                    <label
                      className={`block cursor-pointer rounded-full border-[1.5px] px-3 py-[11px] text-center text-[14px] font-extrabold peer-focus-visible:outline-solid peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand ${
                        values.relation === relation
                          ? "border-[#9FB8EC] bg-[#CCD8F4] text-[#4E72C8]"
                          : "border-line bg-surface text-nav"
                      }`}
                      htmlFor={`link-parent-relation-${relation}`}
                    >
                      {relation}
                    </label>
                  </div>
                ))}
              </div>
            </fieldset>

            <div className={codeCardClass}>
              <div className="mb-2 text-[12px] font-extrabold tracking-[0.7px] text-[#A88526]">
                CÓDIGO DE INVITACIÓN
              </div>
              <div className="text-[13.5px] leading-[1.45] text-[#8A7234]">
                Se genera al enviar y se muestra acá después.
              </div>
            </div>

            <button
              className={`flex w-full cursor-pointer items-center justify-center gap-[9px] rounded-[14px] bg-linear-[180deg,#F4977E,#EE8164] p-[14px] text-[15.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] disabled:cursor-not-allowed disabled:opacity-60 ${focusRingClass}`}
              disabled={pending}
              type="submit"
            >
              <svg
                fill="none"
                height="19"
                stroke="#fff"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="19"
              >
                <path d="m22 2-7 20-4-9-9-4z" />
                <path d="M22 2 11 13" />
              </svg>
              {pending ? "Enviando…" : "Enviar invitación"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

import {
  invitationFixture,
  parentRelationOptions,
  type LinkParentFormValues,
  type ParentRelation,
} from "@/app/_data/kids";

type LinkParentModalProps = {
  open: boolean;
  onClose: () => void;
  kidName: string;
};

function emptyValues(): LinkParentFormValues {
  return {
    parentName: "",
    email: "",
    relation: parentRelationOptions[0],
  };
}

export function LinkParentModal({
  open,
  onClose,
  kidName,
}: LinkParentModalProps) {
  const [values, setValues] = useState<LinkParentFormValues>(emptyValues);

  if (!open) return null;

  const firstName = kidName.split(" ")[0];

  function updateValue<K extends keyof LinkParentFormValues>(
    field: K,
    value: LinkParentFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  const fieldClass =
    "w-full rounded-[14px] border-[1.5px] border-field-border bg-white px-4 py-[13px] text-[15px] text-ink placeholder:text-field-placeholder";
  const labelClass =
    "mb-2 block text-[12px] font-extrabold tracking-[0.7px] text-muted";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(63,54,46,0.45)] px-6 py-10">
      <div
        aria-labelledby="link-parent-title"
        aria-modal="true"
        className="w-full max-w-[480px] overflow-hidden rounded-[24px] border border-line bg-auth-bg shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)]"
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
            className="flex h-[34px] w-[34px] flex-none cursor-pointer items-center justify-center rounded-[10px] bg-[#F0E6D8] text-[#94887B]"
            onClick={onClose}
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

        <form
          className="px-[26px] py-[22px]"
          noValidate
          onSubmit={(event) => event.preventDefault()}
        >
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
            <span className="text-[13.5px] leading-[1.45] text-[#3F5694]">
              Le enviaremos un correo con un código para que active su cuenta.
              Solo verá el feed de {firstName}.
            </span>
          </div>

          <div className="mb-[18px]">
            <label className={labelClass} htmlFor="link-parent-name">
              NOMBRE DEL PADRE/MADRE
            </label>
            <input
              className={fieldClass}
              id="link-parent-name"
              onChange={(event) => updateValue("parentName", event.target.value)}
              placeholder="Ej. Diego Fernández"
              type="text"
              value={values.parentName}
            />
          </div>

          <div className="mb-[18px]">
            <label className={labelClass} htmlFor="link-parent-email">
              EMAIL
            </label>
            <input
              className={fieldClass}
              id="link-parent-email"
              onChange={(event) => updateValue("email", event.target.value)}
              placeholder="correo@ejemplo.com"
              type="email"
              value={values.email}
            />
          </div>

          <fieldset className="mb-5">
            <legend className={labelClass}>PARENTESCO</legend>
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

          <div className="mb-5 rounded-[16px] border-[1.5px] border-dashed border-[#E6D08A] bg-[#FBF1D6] p-[18px] text-center">
            <div className="mb-2 text-[12px] font-extrabold tracking-[0.7px] text-[#A88526]">
              CÓDIGO DE INVITACIÓN
            </div>
            <div className="font-display text-[34px] font-semibold tracking-[7px] text-[#8A7234]">
              {invitationFixture.code}
            </div>
            <div className="mt-[6px] text-[13px] text-[#A88526]">
              {invitationFixture.expiryLabel}
            </div>
          </div>

          <button
            className="flex w-full cursor-pointer items-center justify-center gap-[9px] rounded-[14px] bg-linear-[180deg,#F4977E,#EE8164] p-[14px] text-[15.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)]"
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
            Enviar invitación
          </button>
        </form>
      </div>
    </div>
  );
}

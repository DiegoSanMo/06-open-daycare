"use client";

import { useState } from "react";

import {
  AddKidFormValues,
  formatBirthDate,
  roomOptions,
  RoomOption,
} from "@/app/_data/kids";

type AddKidModalProps = {
  open: boolean;
  onClose: () => void;
};

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: string;
}) {
  return (
    <label
      className="mb-2 block text-[12px] font-extrabold tracking-[0.7px] text-muted"
      htmlFor={htmlFor}
    >
      {children}
    </label>
  );
}

function FieldHelp({ id, children }: { id: string; children: string }) {
  return (
    <p className="mt-1.5 text-[11px] text-muted-soft" id={id}>
      {children}
    </p>
  );
}

export function AddKidModal({ open, onClose }: AddKidModalProps) {
  const [values, setValues] = useState<AddKidFormValues>({
    name: "",
    birthDate: "",
    room: roomOptions[0],
    allergies: "",
    medicalNotes: "",
  });

  if (!open) return null;

  function updateValue<K extends keyof AddKidFormValues>(
    field: K,
    value: AddKidFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  const fieldClass =
    "w-full rounded-[14px] border-[1.5px] border-field-border bg-white px-4 py-[13px] text-[15px] text-ink placeholder:text-field-placeholder";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(63,54,46,0.45)] px-6 py-10">
      <div
        aria-labelledby="add-kid-title"
        aria-modal="true"
        className="w-full max-w-[520px] overflow-hidden rounded-[24px] border border-line bg-auth-bg shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)]"
        role="dialog"
      >
        <form noValidate onSubmit={(event) => event.preventDefault()}>
          <div className="flex items-center justify-between border-b border-line px-[26px] py-5">
            <button
              className="text-[15px] font-bold text-muted"
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <h2
              className="font-display text-[18px] font-semibold text-ink"
              id="add-kid-title"
            >
              Agregar niño
            </h2>
            <button
              className="text-[15px] font-extrabold text-brand"
              type="submit"
            >
              Guardar
            </button>
          </div>

          <div className="px-[26px] py-6">
            <div className="mb-[18px]">
              <FieldLabel htmlFor="kid-name">NOMBRE COMPLETO</FieldLabel>
              <input
                aria-describedby="kid-name-help"
                className={fieldClass}
                id="kid-name"
                onChange={(event) => updateValue("name", event.target.value)}
                placeholder="Ej. Martina López"
                type="text"
                value={values.name}
              />
              <FieldHelp id="kid-name-help">
                Escribí nombre y apellido.
              </FieldHelp>
            </div>

            <div className="mb-[18px] flex gap-[14px]">
              <div className="flex-1">
                <FieldLabel htmlFor="kid-birth-date">
                  FECHA DE NACIMIENTO
                </FieldLabel>
                <input
                  aria-describedby="kid-birth-date-help"
                  className={fieldClass}
                  id="kid-birth-date"
                  inputMode="numeric"
                  maxLength={10}
                  onChange={(event) =>
                    updateValue("birthDate", formatBirthDate(event.target.value))
                  }
                  pattern="\d{2}/\d{2}/\d{4}"
                  placeholder="dd/mm/aaaa"
                  type="text"
                  value={values.birthDate}
                />
                <FieldHelp id="kid-birth-date-help">
                  Completá con el formato dd/mm/aaaa.
                </FieldHelp>
              </div>

              <div className="flex-1">
                <FieldLabel htmlFor="kid-room">SALA</FieldLabel>
                <div className="relative">
                  <select
                    aria-describedby="kid-room-help"
                    className={`${fieldClass} appearance-none pr-10 font-bold`}
                    id="kid-room"
                    onChange={(event) =>
                      updateValue("room", event.target.value as RoomOption)
                    }
                    value={values.room}
                  >
                    {roomOptions.map((room) => (
                      <option key={room} value={room}>
                        {room}
                      </option>
                    ))}
                  </select>
                  <svg
                    aria-hidden="true"
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
                    fill="none"
                    height="16"
                    stroke="#B0A290"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.2"
                    viewBox="0 0 24 24"
                    width="16"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
                <FieldHelp id="kid-room-help">Elegí la sala del niño.</FieldHelp>
              </div>
            </div>

            <div className="mb-[18px]">
              <FieldLabel htmlFor="kid-allergies">ALERGIAS (ETIQUETAS)</FieldLabel>
              <input
                aria-describedby="kid-allergies-help"
                className={fieldClass}
                id="kid-allergies"
                onChange={(event) => updateValue("allergies", event.target.value)}
                placeholder="Ej. Maní, Lactosa"
                type="text"
                value={values.allergies}
              />
              <FieldHelp id="kid-allergies-help">
                Separalas con comas.
              </FieldHelp>
            </div>

            <div>
              <FieldLabel htmlFor="kid-medical-notes">NOTAS MÉDICAS</FieldLabel>
              <textarea
                aria-describedby="kid-medical-notes-help"
                className={`${fieldClass} min-h-[90px] resize-y leading-[1.5]`}
                id="kid-medical-notes"
                onChange={(event) =>
                  updateValue("medicalNotes", event.target.value)
                }
                placeholder="Indicaciones, medicación, contactos…"
                value={values.medicalNotes}
              />
              <FieldHelp id="kid-medical-notes-help">
                Indicaciones o medicación, si aplica.
              </FieldHelp>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

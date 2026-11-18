"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  AddKidFormValues,
  formatBirthDate,
  isValidBirthDate,
  roomOptions,
  RoomOption,
} from "@/app/_data/kids";

type AddKidModalProps = {
  open: boolean;
  onClose: () => void;
};

type FormErrors = Partial<Record<keyof AddKidFormValues, string>>;

function emptyValues(): AddKidFormValues {
  return {
    name: "",
    birthDate: "",
    room: roomOptions[0],
    allergies: "",
    medicalNotes: "",
  };
}

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

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <p className="mt-1.5 text-[12px] font-semibold text-brand" id={id} role="alert">
      {message}
    </p>
  );
}

export function AddKidModal({ open, onClose }: AddKidModalProps) {
  const [values, setValues] = useState<AddKidFormValues>(emptyValues);
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

  function updateValue<K extends keyof AddKidFormValues>(
    field: K,
    value: AddKidFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};
    if (!values.name.trim()) {
      nextErrors.name = "Ingresá el nombre completo.";
    }
    if (!values.birthDate.trim()) {
      nextErrors.birthDate = "Ingresá la fecha de nacimiento.";
    } else if (!isValidBirthDate(values.birthDate)) {
      nextErrors.birthDate = "La fecha no es válida. Usá dd/mm/aaaa.";
    }
    if (!values.room) {
      nextErrors.room = "Elegí una sala.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) handleClose();
  }

  const focusRingClass =
    "focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
  const fieldBaseClass =
    "w-full rounded-[14px] border-[1.5px] bg-white px-4 py-[13px] text-[15px] text-ink placeholder:text-field-placeholder";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(63,54,46,0.45)] px-6 py-10"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <div
        aria-labelledby="add-kid-title"
        aria-modal="true"
        className="w-full max-w-[520px] overflow-hidden rounded-[24px] border border-line bg-auth-bg shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)]"
        ref={dialogRef}
        role="dialog"
      >
        <form noValidate onSubmit={handleSubmit}>
          <div className="flex items-center justify-between border-b border-line px-[26px] py-5">
            <button
              className={`text-[15px] font-bold text-muted ${focusRingClass}`}
              onClick={handleClose}
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
              className={`text-[15px] font-extrabold text-brand ${focusRingClass}`}
              type="submit"
            >
              Guardar
            </button>
          </div>

          <div className="px-[26px] py-6">
            <div className="mb-[18px]">
              <FieldLabel htmlFor="kid-name">NOMBRE COMPLETO</FieldLabel>
              <input
                aria-describedby={
                  errors.name ? "kid-name-help kid-name-error" : "kid-name-help"
                }
                aria-invalid={errors.name ? true : undefined}
                className={`${fieldBaseClass} ${errors.name ? "border-brand" : "border-field-border"} ${focusRingClass}`}
                id="kid-name"
                onChange={(event) => updateValue("name", event.target.value)}
                ref={nameInputRef}
                placeholder="Ej. Martina López"
                type="text"
                value={values.name}
              />
              <FieldHelp id="kid-name-help">Escribí nombre y apellido.</FieldHelp>
              <FieldError id="kid-name-error" message={errors.name} />
            </div>

            <div className="mb-[18px] flex gap-[14px]">
              <div className="flex-1">
                <FieldLabel htmlFor="kid-birth-date">
                  FECHA DE NACIMIENTO
                </FieldLabel>
                <input
                  aria-describedby={
                    errors.birthDate
                      ? "kid-birth-date-help kid-birth-date-error"
                      : "kid-birth-date-help"
                  }
                  aria-invalid={errors.birthDate ? true : undefined}
                  className={`${fieldBaseClass} ${errors.birthDate ? "border-brand" : "border-field-border"} ${focusRingClass}`}
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
                <FieldError
                  id="kid-birth-date-error"
                  message={errors.birthDate}
                />
              </div>

              <div className="flex-1">
                <FieldLabel htmlFor="kid-room">SALA</FieldLabel>
                <div className="relative">
                  <select
                    aria-describedby={
                      errors.room ? "kid-room-help kid-room-error" : "kid-room-help"
                    }
                    aria-invalid={errors.room ? true : undefined}
                    className={`${fieldBaseClass} ${errors.room ? "border-brand" : "border-field-border"} ${focusRingClass} appearance-none pr-10 font-bold`}
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
                <FieldError id="kid-room-error" message={errors.room} />
              </div>
            </div>

            <div className="mb-[18px]">
              <FieldLabel htmlFor="kid-allergies">ALERGIAS (ETIQUETAS)</FieldLabel>
              <input
                aria-describedby="kid-allergies-help"
                className={`${fieldBaseClass} border-field-border ${focusRingClass}`}
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
                className={`${fieldBaseClass} border-field-border ${focusRingClass} min-h-[90px] resize-y leading-[1.5]`}
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

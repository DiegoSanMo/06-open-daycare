"use client";

import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { addKid, type AddKidState } from "@/app/_actions/children";
import type { RoomOptionItem } from "@/app/_data/children";
import {
  type AddKidFormValues,
  formatBirthDate,
  isValidBirthDate,
} from "@/app/_data/kids";

type AddKidModalProps = {
  open: boolean;
  onClose: () => void;
  rooms: RoomOptionItem[];
};

type ModalValues = Omit<AddKidFormValues, "room"> & { room: string };

type FormErrors = Partial<Record<keyof ModalValues, string>>;

const initialState: AddKidState = {
  status: "idle",
  message: "",
  errors: {},
};

function emptyValues(): ModalValues {
  return {
    name: "",
    birthDate: "",
    room: "",
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

export function AddKidModal({ open, onClose, rooms }: AddKidModalProps) {
  const [state, formAction, pending] = useActionState(addKid, initialState);
  const [values, setValues] = useState<ModalValues>(emptyValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    setValues(emptyValues());
    setErrors({});
    onClose();
  }, [onClose]);

  // Effect Events read the latest `handleClose` without making the effects
  // below depend on the identity of the `onClose` prop.
  const closeDialog = useEffectEvent(() => {
    // Keep the close in the same transition as the /kids revalidation so the
    // new row is already there when the dialog disappears.
    startTransition(() => {
      handleClose();
    });
  });

  useEffect(() => {
    if (!open) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    // `showModal()` throws if called while the dialog is already open, which
    // happens during Strict Mode's extra setup/cleanup cycle.
    if (!dialog.open) dialog.showModal();
    nameInputRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // The native dialog handles Escape (and focus containment); syncing the
    // `cancel` event keeps the parent state in step with the visual close.
    function handleCancel() {
      closeDialog();
    }

    dialog.addEventListener("cancel", handleCancel);
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  }, [open]);

  useEffect(() => {
    if (state.status !== "success") return;
    // Each action result is a new `state` object, so consecutive submissions
    // close the dialog even if the parent keeps this same instance mounted.
    closeDialog();
  }, [state]);

  if (!open) return null;

  function updateValue<K extends keyof ModalValues>(
    field: K,
    value: ModalValues[K],
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
    if (Object.keys(nextErrors).length > 0) return;

    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
  }

  const fieldErrors: FormErrors = {
    ...(state.status === "error" ? state.errors : {}),
    ...errors,
  };

  const focusRingClass =
    "focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
  const fieldBaseClass =
    "w-full rounded-[14px] border-[1.5px] bg-white px-4 py-[13px] text-[15px] text-ink placeholder:text-field-placeholder";

  return (
    <dialog
      aria-labelledby="add-kid-title"
      className="mx-auto my-10 max-h-[calc(100dvh-5rem)] w-[calc(100%-3rem)] max-w-[520px] overflow-y-auto bg-transparent p-0 backdrop:bg-[rgba(63,54,46,0.45)]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
      ref={dialogRef}
    >
      <div className="w-full overflow-hidden rounded-[24px] border border-line bg-auth-bg shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)]">
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
              className={`text-[15px] font-extrabold text-brand disabled:cursor-not-allowed disabled:opacity-50 ${focusRingClass}`}
              disabled={pending}
              type="submit"
            >
              {pending ? "Guardando…" : "Guardar"}
            </button>
          </div>

          <div className="px-[26px] py-6">
            {state.status === "error" && state.message && (
              <p
                className="mb-4 rounded-[12px] border border-line bg-surface px-4 py-3 text-[13px] font-semibold text-brand"
                role="alert"
              >
                {state.message}
              </p>
            )}

            <div className="mb-[18px]">
              <FieldLabel htmlFor="kid-name">NOMBRE COMPLETO</FieldLabel>
              <input
                aria-describedby={
                  fieldErrors.name ? "kid-name-help kid-name-error" : "kid-name-help"
                }
                aria-invalid={fieldErrors.name ? true : undefined}
                className={`${fieldBaseClass} ${fieldErrors.name ? "border-brand" : "border-field-border"} ${focusRingClass}`}
                id="kid-name"
                name="name"
                onChange={(event) => updateValue("name", event.target.value)}
                ref={nameInputRef}
                placeholder="Ej. Martina López"
                type="text"
                value={values.name}
              />
              <FieldHelp id="kid-name-help">Escribí nombre y apellido.</FieldHelp>
              <FieldError id="kid-name-error" message={fieldErrors.name} />
            </div>

            <div className="mb-[18px] flex gap-[14px]">
              <div className="flex-1">
                <FieldLabel htmlFor="kid-birth-date">
                  FECHA DE NACIMIENTO
                </FieldLabel>
                <input
                  aria-describedby={
                    fieldErrors.birthDate
                      ? "kid-birth-date-help kid-birth-date-error"
                      : "kid-birth-date-help"
                  }
                  aria-invalid={fieldErrors.birthDate ? true : undefined}
                  className={`${fieldBaseClass} ${fieldErrors.birthDate ? "border-brand" : "border-field-border"} ${focusRingClass}`}
                  id="kid-birth-date"
                  inputMode="numeric"
                  maxLength={10}
                  name="birthDate"
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
                  message={fieldErrors.birthDate}
                />
              </div>

              <div className="flex-1">
                <FieldLabel htmlFor="kid-room">SALA</FieldLabel>
                <div className="relative">
                  <select
                    aria-describedby={
                      fieldErrors.room ? "kid-room-help kid-room-error" : "kid-room-help"
                    }
                    aria-invalid={fieldErrors.room ? true : undefined}
                    className={`${fieldBaseClass} ${fieldErrors.room ? "border-brand" : "border-field-border"} ${focusRingClass} appearance-none pr-10 font-bold`}
                    id="kid-room"
                    name="room"
                    onChange={(event) =>
                      updateValue("room", event.target.value)
                    }
                    value={values.room}
                  >
                    <option value="">Seleccione sala</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name}
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
                <FieldError id="kid-room-error" message={fieldErrors.room} />
              </div>
            </div>

            <div className="mb-[18px]">
              <FieldLabel htmlFor="kid-allergies">ALERGIAS (ETIQUETAS)</FieldLabel>
              <input
                aria-describedby="kid-allergies-help"
                className={`${fieldBaseClass} border-field-border ${focusRingClass}`}
                id="kid-allergies"
                name="allergies"
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
                name="medicalNotes"
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
    </dialog>
  );
}

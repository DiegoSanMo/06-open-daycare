"use client";

import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import {
  newPostPlaceholder,
  postAudienceOptions,
  postTypeOptions,
  type NewPostFormValues,
  type NewPostPhoto,
  type PostAudienceId,
  type PostTypeId,
} from "@/app/_data/feed";

type NewPostModalProps = {
  open: boolean;
  onClose: () => void;
};

type FormErrors = Partial<Record<keyof NewPostFormValues, string>>;

const labelClass =
  "mb-[10px] block text-[12px] font-extrabold tracking-[0.7px] text-muted";

const focusRingClass =
  "peer-focus-visible:outline-solid peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand";

const fieldFocusRingClass =
  "focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

const audienceChipClass =
  "flex cursor-pointer items-center gap-2 rounded-full border-[1.5px] py-[6px] pl-[6px] pr-[14px] text-[14px] font-bold";
const audienceChipActiveClass = "border-ink bg-ink text-white";
const audienceChipInactiveClass = "border-line bg-surface text-nav";
const allRoomChipClass =
  "cursor-pointer rounded-full border-[1.5px] px-4 py-[6px] text-[14px] font-bold";
const typeChipClass =
  "cursor-pointer rounded-full px-4 py-2 text-[13.5px] font-extrabold";
const selectedTypeRingClass = "ring-2 ring-[#3F362E] ring-offset-2 ring-offset-auth-bg";
const errorRingClass = "ring-2 ring-brand ring-offset-2 ring-offset-auth-bg";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <p className="mt-1.5 text-[12px] font-semibold text-brand" id={id} role="alert">
      {message}
    </p>
  );
}

function emptyValues(): NewPostFormValues {
  return {
    audienceIds: [],
    allRoom: false,
    type: "",
    description: "",
    photos: [],
  };
}

export function NewPostModal({ open, onClose }: NewPostModalProps) {
  const [values, setValues] = useState<NewPostFormValues>(emptyValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoUrlsRef = useRef<string[]>([]);

  const handleClose = useCallback(() => {
    photoUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    photoUrlsRef.current = [];
    setValues(emptyValues());
    setErrors({});
    onClose();
  }, [onClose]);

  if (!open) return null;

  function toggleAudience(id: PostAudienceId) {
    setValues((current) => ({
      ...current,
      allRoom: false,
      audienceIds: current.audienceIds.includes(id)
        ? current.audienceIds.filter((item) => item !== id)
        : [...current.audienceIds, id],
    }));
  }

  function toggleAllRoom() {
    setValues((current) => ({
      ...current,
      allRoom: !current.allRoom,
      audienceIds: [],
    }));
  }

  function selectType(id: PostTypeId) {
    setValues((current) => ({ ...current, type: id }));
  }

  function updateValue<K extends keyof NewPostFormValues>(
    field: K,
    value: NewPostFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const photos: NewPostPhoto[] = files.map((file) => {
      const url = URL.createObjectURL(file);
      photoUrlsRef.current.push(url);
      return { id: crypto.randomUUID(), url, name: file.name };
    });
    setValues((current) => ({
      ...current,
      photos: [...current.photos, ...photos],
    }));
    event.target.value = "";
  }

  function handleRemovePhoto(photo: NewPostPhoto) {
    URL.revokeObjectURL(photo.url);
    photoUrlsRef.current = photoUrlsRef.current.filter(
      (url) => url !== photo.url,
    );
    setValues((current) => ({
      ...current,
      photos: current.photos.filter((item) => item.id !== photo.id),
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};
    if (!values.allRoom && values.audienceIds.length === 0) {
      nextErrors.audienceIds = "Elegí al menos un destinatario.";
    }
    if (!values.type) {
      nextErrors.type = "Elegí un tipo de publicación.";
    }
    if (!values.description.trim()) {
      nextErrors.description = "Escribí una descripción.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) handleClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(63,54,46,0.45)] px-6 py-10"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <div
        aria-labelledby="new-post-title"
        aria-modal="true"
        className="max-h-[calc(100vh-80px)] w-full max-w-[580px] overflow-y-auto rounded-[24px] border border-line bg-auth-bg shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)]"
        role="dialog"
      >
        <form noValidate onSubmit={handleSubmit}>
          <div className="flex items-center justify-between border-b border-line px-[26px] py-5">
            <button
              className="cursor-pointer text-[15px] font-bold text-muted"
              onClick={handleClose}
              type="button"
            >
              Cancelar
            </button>
            <h2
              className="font-display text-[18px] font-semibold text-ink"
              id="new-post-title"
            >
              Nueva publicación
            </h2>
            <button
              className="cursor-pointer text-[15px] font-extrabold text-brand"
              type="submit"
            >
              Publicar
            </button>
          </div>

          <div className="px-[26px] py-6">
            <fieldset
              aria-describedby={
                errors.audienceIds ? "new-post-audience-error" : undefined
              }
              aria-invalid={errors.audienceIds ? true : undefined}
              className="mb-[22px]"
            >
              <legend className={labelClass}>PARA</legend>
              <div className="flex flex-wrap gap-[9px]">
                {postAudienceOptions.map((option) => {
                  const checked = values.audienceIds.includes(option.id);
                  return (
                    <div key={option.id}>
                      <input
                        aria-describedby={
                          errors.audienceIds
                            ? "new-post-audience-error"
                            : undefined
                        }
                        checked={checked}
                        className="peer sr-only"
                        id={`new-post-audience-${option.id}`}
                        onChange={() => toggleAudience(option.id)}
                        type="checkbox"
                      />
                      <label
                        className={`${audienceChipClass} ${focusRingClass} ${
                          checked
                            ? audienceChipActiveClass
                            : `${audienceChipInactiveClass} ${errors.audienceIds ? "border-brand" : ""}`
                        }`}
                        htmlFor={`new-post-audience-${option.id}`}
                      >
                        <span
                          className="flex h-[26px] w-[26px] items-center justify-center rounded-full font-display text-[13px] font-semibold"
                          style={{
                            backgroundColor: option.avatarBg,
                            color: option.avatarFg,
                          }}
                        >
                          {option.initial}
                        </span>
                        {option.label}
                      </label>
                    </div>
                  );
                })}

                <div>
                  <input
                    aria-describedby={
                      errors.audienceIds ? "new-post-audience-error" : undefined
                    }
                    checked={values.allRoom}
                    className="peer sr-only"
                    id="new-post-all-room"
                    onChange={toggleAllRoom}
                    type="checkbox"
                  />
                  <label
                    className={`${allRoomChipClass} ${focusRingClass} ${
                      values.allRoom
                        ? audienceChipActiveClass
                        : `${audienceChipInactiveClass} ${errors.audienceIds ? "border-brand" : ""}`
                    }`}
                    htmlFor="new-post-all-room"
                  >
                    Toda la sala
                  </label>
                </div>
              </div>
              <FieldError
                id="new-post-audience-error"
                message={errors.audienceIds}
              />
            </fieldset>

            <fieldset
              aria-describedby={errors.type ? "new-post-type-error" : undefined}
              aria-invalid={errors.type ? true : undefined}
              className="mb-[22px]"
            >
              <legend className={labelClass}>TIPO</legend>
              <div className="flex flex-wrap gap-[9px]">
                {postTypeOptions.map((option) => {
                  const checked = values.type === option.id;
                  return (
                    <div key={option.id}>
                      <input
                        aria-describedby={
                          errors.type ? "new-post-type-error" : undefined
                        }
                        checked={checked}
                        className="peer sr-only"
                        id={`new-post-type-${option.id}`}
                        name="new-post-type"
                        onChange={() => selectType(option.id)}
                        type="radio"
                        value={option.id}
                      />
                      <label
                        className={`${typeChipClass} ${focusRingClass} ${
                          checked
                            ? selectedTypeRingClass
                            : errors.type
                              ? errorRingClass
                              : ""
                        }`}
                        htmlFor={`new-post-type-${option.id}`}
                        style={{ backgroundColor: option.bg, color: option.fg }}
                      >
                        {option.label}
                      </label>
                    </div>
                  );
                })}
              </div>
              <FieldError id="new-post-type-error" message={errors.type} />
            </fieldset>

            <div className="mb-[22px]">
              <label className={labelClass} htmlFor="new-post-description">
                DESCRIPCIÓN
              </label>
              <textarea
                aria-describedby={
                  errors.description ? "new-post-description-error" : undefined
                }
                aria-invalid={errors.description ? true : undefined}
                className={`min-h-[120px] w-full resize-y rounded-[14px] border-[1.5px] bg-white px-4 py-[14px] text-[15px] leading-[1.5] text-ink placeholder:text-field-placeholder ${fieldFocusRingClass} ${
                  errors.description ? "border-brand" : "border-field-border"
                }`}
                id="new-post-description"
                onChange={(event) => updateValue("description", event.target.value)}
                placeholder={newPostPlaceholder}
                value={values.description}
              />
              <FieldError
                id="new-post-description-error"
                message={errors.description}
              />
            </div>

            <div>
              <span className={labelClass}>FOTOS</span>
              <div className="flex gap-3">
                {values.photos.map((photo) => (
                  <div className="relative" key={photo.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={photo.name}
                      className="h-24 w-24 rounded-[14px] border border-line bg-photo-bg object-cover"
                      src={photo.url}
                    />
                    <button
                      aria-label={`Quitar ${photo.name}`}
                      className={`absolute -right-2 -top-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-ink text-white ${fieldFocusRingClass}`}
                      onClick={() => handleRemovePhoto(photo)}
                      type="button"
                    >
                      <svg
                        aria-hidden="true"
                        fill="none"
                        height="12"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth="2.4"
                        viewBox="0 0 24 24"
                        width="12"
                      >
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}

                <input
                  accept="image/*"
                  className="sr-only"
                  multiple
                  onChange={handlePhotoChange}
                  ref={fileInputRef}
                  type="file"
                />
                <button
                  className={`flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-photo-line bg-photo-bg text-photo-label ${fieldFocusRingClass}`}
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  <svg
                    aria-hidden="true"
                    fill="none"
                    height="22"
                    stroke="#C5503A"
                    strokeLinecap="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="22"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span className="text-[12px]">Agregar</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

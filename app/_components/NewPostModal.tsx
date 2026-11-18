"use client";

import { useState } from "react";

import {
  postAudienceOptions,
  postTypeOptions,
  type NewPostFormValues,
  type PostAudienceId,
  type PostTypeId,
} from "@/app/_data/feed";

type NewPostModalProps = {
  open: boolean;
  onClose: () => void;
};

const labelClass =
  "mb-[10px] block text-[12px] font-extrabold tracking-[0.7px] text-muted";

const focusRingClass =
  "peer-focus-visible:outline-solid peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand";

const audienceChipClass =
  "flex cursor-pointer items-center gap-2 rounded-full border-[1.5px] py-[6px] pl-[6px] pr-[14px] text-[14px] font-bold";
const audienceChipActiveClass = "border-ink bg-ink text-white";
const audienceChipInactiveClass = "border-line bg-surface text-nav";
const allRoomChipClass =
  "cursor-pointer rounded-full border-[1.5px] px-4 py-[6px] text-[14px] font-bold";
const typeChipClass =
  "cursor-pointer rounded-full px-4 py-2 text-[13.5px] font-extrabold";

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(63,54,46,0.45)] px-6 py-10"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        aria-labelledby="new-post-title"
        aria-modal="true"
        className="max-h-[calc(100vh-80px)] w-full max-w-[580px] overflow-y-auto rounded-[24px] border border-line bg-auth-bg shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)]"
        role="dialog"
      >
        <div className="flex items-center justify-between border-b border-line px-[26px] py-5">
          <button
            className="cursor-pointer text-[15px] font-bold text-muted"
            onClick={onClose}
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
            type="button"
          >
            Publicar
          </button>
        </div>

        <div className="px-[26px] py-6">
          <fieldset className="mb-[22px]">
            <legend className={labelClass}>PARA</legend>
            <div className="flex flex-wrap gap-[9px]">
              {postAudienceOptions.map((option) => {
                const checked = values.audienceIds.includes(option.id);
                return (
                  <div key={option.id}>
                    <input
                      checked={checked}
                      className="peer sr-only"
                      id={`new-post-audience-${option.id}`}
                      onChange={() => toggleAudience(option.id)}
                      type="checkbox"
                    />
                    <label
                      className={`${audienceChipClass} ${focusRingClass} ${
                        checked ? audienceChipActiveClass : audienceChipInactiveClass
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
                      : audienceChipInactiveClass
                  }`}
                  htmlFor="new-post-all-room"
                >
                  Toda la sala
                </label>
              </div>
            </div>
          </fieldset>

          <fieldset className="mb-[22px]">
            <legend className={labelClass}>TIPO</legend>
            <div className="flex flex-wrap gap-[9px]">
              {postTypeOptions.map((option) => {
                const checked = values.type === option.id;
                return (
                  <div key={option.id}>
                    <input
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
                        checked ? "ring-2 ring-[#3F362E] ring-offset-2 ring-offset-auth-bg" : ""
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
          </fieldset>

          <div className="mb-[22px]">
            <label className={labelClass} htmlFor="new-post-description">
              DESCRIPCIÓN
            </label>
          </div>

          <div>
            <span className={labelClass}>FOTOS</span>
            <div className="flex gap-3" />
          </div>
        </div>
      </div>
    </div>
  );
}

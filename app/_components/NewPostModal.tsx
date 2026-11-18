"use client";

type NewPostModalProps = {
  open: boolean;
  onClose: () => void;
};

const labelClass =
  "mb-[10px] block text-[12px] font-extrabold tracking-[0.7px] text-muted";

export function NewPostModal({ open, onClose }: NewPostModalProps) {
  if (!open) return null;

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
            <div className="flex flex-wrap gap-[9px]" />
          </fieldset>

          <fieldset className="mb-[22px]">
            <legend className={labelClass}>TIPO</legend>
            <div className="flex flex-wrap gap-[9px]" />
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

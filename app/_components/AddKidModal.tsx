"use client";

type AddKidModalProps = {
  open: boolean;
  onClose: () => void;
};

export function AddKidModal({ open, onClose }: AddKidModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(63,54,46,0.45)] px-6 py-10">
      <div
        aria-labelledby="add-kid-title"
        aria-modal="true"
        className="w-full max-w-[520px] overflow-hidden rounded-[24px] border border-line bg-auth-bg shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)]"
        role="dialog"
      >
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
            type="button"
          >
            Guardar
          </button>
        </div>
        <div className="px-[26px] py-6" />
      </div>
    </div>
  );
}

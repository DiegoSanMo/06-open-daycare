"use client";

type LinkParentModalProps = {
  open: boolean;
  onClose: () => void;
  kidName: string;
};

export function LinkParentModal({
  open,
  onClose,
  kidName,
}: LinkParentModalProps) {
  if (!open) return null;

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
            className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px] bg-[#F0E6D8] text-[#94887B] cursor-pointer"
            onClick={onClose}
            type="button"
          >
            <svg
              height="18"
              viewBox="0 0 24 24"
              width="18"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.2"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

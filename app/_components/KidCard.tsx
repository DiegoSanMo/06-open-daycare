import Link from "next/link";
import type { Kid } from "../_data/kids";

function Chevron() {
  return (
    <svg
      className="flex-none"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#CBB89F"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function KidCard({ kid }: { kid: Kid }) {
  const badge = kid.listBadge;

  return (
    <Link
      href={`/kids/${kid.id}`}
      className="flex min-w-0 items-center gap-[14px] rounded-[18px] border border-line bg-surface p-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,0.5)] transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-[#F2A78E]"
    >
      <div
        className="flex h-12 w-12 flex-none items-center justify-center rounded-full font-display text-[19px] font-semibold"
        style={{ backgroundColor: kid.avatarBg, color: kid.avatarFg }}
      >
        {kid.initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-display text-[16px] font-semibold text-ink">
          {kid.name}
        </div>
        <div className="text-[13px] text-muted-soft">
          {kid.linkedParentsLabel}
        </div>
      </div>
      {badge ? (
        <span
          className={`flex-none rounded-full px-[9px] py-[5px] text-[11px] font-extrabold ${
            badge.tone === "allergy"
              ? "bg-[#FBD8CC] text-[#D9684A]"
              : "bg-[#F9D2DE] text-[#C56486]"
          }`}
        >
          {badge.label}
        </span>
      ) : (
        <Chevron />
      )}
    </Link>
  );
}

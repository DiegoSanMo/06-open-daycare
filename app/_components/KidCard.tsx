import Link from "next/link";
import type { ChildListItem } from "../_data/children";

type AvatarTone = { bg: string; fg: string };

const AVATAR_TONES: AvatarTone[] = [
  { bg: "#A9D9E8", fg: "#1F7A93" },
  { bg: "#F4B8CC", fg: "#C44A7A" },
  { bg: "#B9DEC4", fg: "#3E8B62" },
  { bg: "#F4DC8E", fg: "#9A7B1E" },
  { bg: "#C9B6E8", fg: "#7B5FC0" },
];

// Preserves the exact avatar colors of the eight children from the SPEC 02
// prototype. Any other child gets a deterministic tone from the same palette.
const PROTOTYPE_TONE_INDEX: Record<string, number> = {
  "mateo-fernandez": 0,
  "sofia-mendez": 1,
  "benjamin-ruiz": 2,
  "valentina-soto": 3,
  "tomas-diaz": 4,
  "emma-castro": 1,
  "lucas-romero": 0,
  "olivia-vega": 2,
};

function getAvatarTone(slug: string): AvatarTone {
  const fallback = Array.from(slug).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const index = PROTOTYPE_TONE_INDEX[slug] ?? fallback;
  return AVATAR_TONES[index % AVATAR_TONES.length];
}

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

export function KidCard({ child }: { child: ChildListItem }) {
  const tone = getAvatarTone(child.slug);
  const badgeLabel = child.allergyBadges.join(" · ");

  return (
    <Link
      href={`/kids/${child.slug}`}
      className="flex min-w-0 items-center gap-[14px] rounded-[18px] border border-line bg-surface p-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,0.5)] transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-[#F2A78E]"
    >
      <div
        className="flex h-12 w-12 flex-none items-center justify-center rounded-full font-display text-[19px] font-semibold"
        style={{ backgroundColor: tone.bg, color: tone.fg }}
      >
        {child.initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-display text-[16px] font-semibold text-ink">
          {child.name}
        </div>
        <div className="text-[13px] text-muted-soft">
          {child.ageLabel} · {child.roomName}
        </div>
      </div>
      {badgeLabel ? (
        <span className="flex-none rounded-full bg-[#FBD8CC] px-[9px] py-[5px] text-[11px] font-extrabold text-[#D9684A]">
          {badgeLabel}
        </span>
      ) : (
        <Chevron />
      )}
    </Link>
  );
}

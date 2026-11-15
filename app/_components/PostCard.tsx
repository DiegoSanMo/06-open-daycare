export type PostKind = "logro" | "actividad" | "anuncio";

export type PostCardProps = {
  kind: PostKind;
  author: string;
  time: string;
  audience: string;
  body: string;
  likes: number;
  comments: number;
};

const badges: Record<PostKind, { label: string; className: string }> = {
  logro: {
    label: "LOGRO",
    className: "bg-badge-logro-bg text-badge-logro-fg",
  },
  actividad: {
    label: "ACTIVIDAD",
    className: "bg-badge-actividad-bg text-badge-actividad-fg",
  },
  anuncio: {
    label: "ANUNCIO",
    className: "bg-badge-anuncio-bg text-badge-anuncio-fg",
  },
};

const commentIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
  </svg>
);

export function PostCard({
  kind,
  author,
  time,
  audience,
  body,
  likes,
  comments,
}: PostCardProps) {
  const badge = badges[kind];
  const isAnnouncement = kind === "anuncio";

  return (
    <article className="rounded-[20px] border border-line bg-surface px-[22px] py-5 shadow-[0_4px_16px_-12px_rgba(120,90,60,0.5)]">
      <div className="mb-[14px] flex items-center gap-3">
        <div
          className={`flex h-11 w-11 flex-none items-center justify-center rounded-full ${
            isAnnouncement
              ? "bg-avatar-announcement-bg text-avatar-announcement-fg"
              : "bg-avatar-child-bg font-display text-[17px] font-semibold text-avatar-child-fg"
          }`}
        >
          {isAnnouncement ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m3 11 18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6" />
            </svg>
          ) : (
            author.charAt(0)
          )}
        </div>

        <div className="flex-1">
          <div className="font-display text-[16.5px] font-semibold text-ink">
            {author}
          </div>
          <div className="text-[12.5px] text-muted-soft">
            {time} · publicado por vos
          </div>
        </div>

        <div
          className={`flex items-center gap-[7px] rounded-full px-3 py-1.5 ${badge.className}`}
        >
          <span className="h-2 w-2 rounded-full bg-current" />
          <span className="text-[12px] font-extrabold tracking-[0.5px]">
            {badge.label}
          </span>
        </div>
      </div>

      <div className="mb-2.5 text-[12.5px] text-muted-soft">
        Para: {audience}
      </div>

      <p className="text-[15.5px] leading-[1.55] text-ink-body">{body}</p>

      <div className="mt-4 flex items-center gap-[18px] border-t border-line-soft pt-3.5">
        <span className="flex items-center gap-[7px] text-[14px] font-bold text-coral">
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="#E0654A"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
          {likes}
        </span>

        <a className="flex items-center gap-[7px] text-[14px] font-bold text-muted">
          {commentIcon}
          {comments}
        </a>

        <span className="flex-1" />

        <a className="text-[14px] font-extrabold text-brand-strong">Editar</a>
      </div>
    </article>
  );
}

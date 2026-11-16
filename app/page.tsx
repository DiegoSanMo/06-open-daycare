import { AppShell } from "./_components/AppShell";
import { PostCard } from "./_components/PostCard";
import { posts, teacher } from "./_data/feed";

const firstName = teacher.name.split(" ")[0];

export default function Home() {
  return (
    <AppShell active="feed" contentMaxWidth={760}>
      <div className="mb-6">
        <div className="mb-1 text-[12.5px] font-extrabold tracking-[0.8px] text-brand">
          GUARDERÍA · SALA SOLES
        </div>
        <h1 className="font-display text-[30px] font-semibold text-ink">
          Buenas, {firstName}
        </h1>
        <p className="mt-[5px] text-[14.5px] text-muted">
          {teacher.childrenCount} niños · {teacher.dateLabel}
        </p>
      </div>

      <a
        aria-disabled="true"
        className="mb-6 flex items-center gap-[14px] rounded-[18px] border border-line bg-surface px-[18px] py-[14px] shadow-[0_4px_14px_-10px_rgba(120,90,60,0.4)]"
      >
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-avatar-teacher font-display text-[16px] font-semibold text-white">
          {teacher.initial}
        </div>
        <span className="flex-1 text-[15px] text-muted-soft">
          Compartí un momento…
        </span>
        <span className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-brand-soft text-coral">
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </span>
      </a>

      <div className="mb-[14px] flex items-center gap-[14px]">
        <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-section">
          PUBLICADO HOY
        </span>
        <span className="h-px flex-1 bg-line-strong" />
      </div>

      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <PostCard key={post.id} {...post} />
        ))}
      </div>
    </AppShell>
  );
}

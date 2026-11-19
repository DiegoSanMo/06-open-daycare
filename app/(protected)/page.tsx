import { AppShell } from "../_components/AppShell";
import { NewPostButton } from "../_components/NewPostButton";
import { PostCard } from "../_components/PostCard";
import { posts, teacher } from "../_data/feed";

export const instant = false;

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

      <NewPostButton variant="compose" />

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

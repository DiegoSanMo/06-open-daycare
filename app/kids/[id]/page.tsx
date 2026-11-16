import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "../../_components/AppShell";
import { getKidById } from "../../_data/kids";

export default async function KidProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const kid = getKidById(id);

  if (!kid) {
    notFound();
  }

  return (
    <AppShell active="kids" contentMaxWidth={820}>
      <Link
        href="/kids"
        className="mb-5 flex items-center gap-[7px] text-[14px] font-bold text-muted"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Volver a Niños
      </Link>

      <div className="flex flex-wrap items-start gap-[26px]">
        <div className="flex min-w-[300px] flex-1 flex-col gap-[18px]">
          <div className="flex items-center gap-[18px]">
            <div
              className="flex h-[84px] w-[84px] flex-none items-center justify-center rounded-full font-display text-[34px] font-semibold"
              style={{ backgroundColor: kid.avatarBg, color: kid.avatarFg }}
            >
              {kid.initial}
            </div>
            <div className="flex-1">
              <h1 className="m-0 font-display text-[28px] font-semibold text-ink">
                {kid.name}
              </h1>
              <p className="mt-[3px] text-[15px] text-muted">
                {kid.ageLabel} · {kid.room}
              </p>
            </div>
            <a
              aria-disabled="true"
              className="rounded-xl border-[1.5px] border-line bg-surface px-4 py-[9px] text-[14px] font-bold text-nav"
            >
              Editar
            </a>
          </div>

          {kid.allergiesNote ? (
            <div className="flex gap-[14px] rounded-2xl bg-[#FBDAD6] p-[16px_18px]">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[11px] bg-[#F4A8A0]">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                  <path d="M12 9v4M12 17h.01" />
                </svg>
              </div>
              <div>
                <div className="mb-0.5 text-[15px] font-extrabold text-[#C5413A]">
                  Alergias y notas
                </div>
                <div className="text-[14.5px] leading-[1.5] text-[#B25249]">
                  {kid.allergiesNote}
                </div>
              </div>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="flex justify-between border-b border-line-soft p-[15px_18px]">
              <span className="text-[14.5px] text-muted">Fecha de nacimiento</span>
              <span className="text-[14.5px] font-extrabold text-ink">
                {kid.birthDateLabel}
              </span>
            </div>
            <div className="flex justify-between border-b border-line-soft p-[15px_18px]">
              <span className="text-[14.5px] text-muted">Sala</span>
              <span className="text-[14.5px] font-extrabold text-ink">
                {kid.room}
              </span>
            </div>
            <div className="flex justify-between p-[15px_18px]">
              <span className="text-[14.5px] text-muted">Ingreso</span>
              <span className="text-[14.5px] font-extrabold text-ink">
                {kid.joinedLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex w-[300px] flex-none flex-col gap-[14px]">
          <a
            aria-disabled="true"
            className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-[#3F362E] p-[13px] text-[15px] font-extrabold text-white"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
            Resumen del día
          </a>

          <div className="rounded-2xl border border-line bg-surface p-[16px_18px]">
            <div className="mb-[14px] text-[12.5px] font-extrabold tracking-[0.8px] text-section">
              PADRES VINCULADOS
            </div>
            <div className="flex flex-col gap-[14px]">
              {kid.linkedParents.map((parent) => (
                <div key={parent.id} className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 flex-none items-center justify-center rounded-full font-display text-[16px] font-semibold text-white"
                    style={{ backgroundColor: parent.avatarBg }}
                  >
                    {parent.initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14.5px] font-extrabold text-ink">
                      {parent.name}
                    </div>
                    <div className="text-[12.5px] text-muted-soft">
                      {parent.relation} · {parent.statusLabel}
                    </div>
                  </div>
                  <span
                    className={`flex-none rounded-full px-[9px] py-1 text-[10.5px] font-extrabold ${
                      parent.status === "active"
                        ? "bg-[#CFEBD8] text-[#3E9B6C]"
                        : "bg-[#F7E7A6] text-[#9A7B1E]"
                    }`}
                  >
                    {parent.badgeLabel}
                  </span>
                </div>
              ))}

              <a
                aria-disabled="true"
                className="flex items-center gap-3 pt-2"
              >
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#D8CBBA] text-[#B0A290]">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
                <span className="text-[14.5px] font-extrabold text-brand-strong">
                  Vincular otro padre
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

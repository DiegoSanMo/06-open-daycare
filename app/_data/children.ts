import { createClient } from "@/utils/supabase/server";

export type ChildListItem = {
  id: string;
  slug: string;
  name: string;
  initial: string;
  ageLabel: string;
  roomId: string;
  roomName: string;
  allergyTags: string[];
  allergyBadges: string[];
  joinedLabel: string;
};

export type RoomSection = {
  id: string;
  name: string;
  children: ChildListItem[];
};

type RoomRow = {
  id: string;
  name: string;
};

type ChildRow = {
  id: string;
  full_name: string;
  birth_date: string;
  enrolled_at: string;
  allergy_tags: string[] | null;
  rooms: RoomRow | null;
};

const allergyBadgeLabels: Record<string, string> = {
  peanut: "MANÍ",
  lactose: "LACTOSA",
};

const ROOM_ORDER = ["Soles", "Luna", "Estrellas"];

const monthLabels = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

function toSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatJoinedLabel(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  return `${monthLabels[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function getAgeLabel(birthDate: string, now: Date): string {
  const birth = new Date(`${birthDate}T00:00:00Z`);
  const months =
    (now.getUTCFullYear() - birth.getUTCFullYear()) * 12 +
    now.getUTCMonth() -
    birth.getUTCMonth() -
    (now.getUTCDate() < birth.getUTCDate() ? 1 : 0);

  if (months < 12) return `${Math.max(months, 0)} meses`;
  return `${Math.floor(months / 12)} años`;
}

function toChildListItem(row: ChildRow, now: Date): ChildListItem {
  const allergyTags = row.allergy_tags ?? [];
  const roomName = row.rooms?.name ?? "";

  return {
    id: row.id,
    slug: toSlug(row.full_name),
    name: row.full_name,
    initial: row.full_name.charAt(0).toUpperCase(),
    ageLabel: getAgeLabel(row.birth_date, now),
    roomId: row.rooms?.id ?? "",
    roomName: roomName ? `Sala ${roomName}` : "",
    allergyTags,
    allergyBadges: allergyTags.map((tag) => allergyBadgeLabels[tag] ?? tag.toUpperCase()),
    joinedLabel: formatJoinedLabel(row.enrolled_at),
  };
}

export async function getKidsWithRooms(): Promise<{
  rooms: RoomSection[];
  error: string | null;
}> {
  const supabase = await createClient();
  const [roomsResult, childrenResult] = await Promise.all([
    supabase.from("rooms").select("id, name").order("name", { ascending: true }),
    supabase
      .from("children")
      .select(
        "id, full_name, birth_date, enrolled_at, allergy_tags, medical_notes, rooms!inner(id, name)",
      )
      .eq("status", "active")
      .order("full_name", { ascending: true }),
  ]);

  if (roomsResult.error || childrenResult.error) {
    return {
      rooms: [],
      error: "No se pudieron cargar los niños. Intentá nuevamente.",
    };
  }

  const now = new Date();
  const children = (childrenResult.data as unknown as ChildRow[]).map((row) =>
    toChildListItem(row, now),
  );

  const rooms = (roomsResult.data as RoomRow[])
    .sort((a, b) => {
      const aIndex = ROOM_ORDER.indexOf(a.name);
      const bIndex = ROOM_ORDER.indexOf(b.name);
      if (aIndex === -1 && bIndex === -1) return a.name.localeCompare(b.name);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    })
    .map((room) => ({
      id: room.id,
      name: room.name,
      children: children.filter((child) => child.roomId === room.id),
    }));

  return { rooms, error: null };
}

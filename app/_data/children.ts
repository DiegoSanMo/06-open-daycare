import { connection } from "next/server";

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

export type RoomOptionItem = {
  id: string;
  name: string;
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

export const allergyTagLabels: Record<string, string> = {
  mani: "peanut",
  lactosa: "lactose",
};

export function allergyTagsFromLabels(value: string): string[] {
  return value
    .split(",")
    .map((entry) => toSlug(entry.trim()))
    .filter((entry) => entry.length > 0)
    .map((entry) => allergyTagLabels[entry] ?? entry);
}

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

function sortRooms<T extends RoomRow>(a: T, b: T): number {
  const aIndex = ROOM_ORDER.indexOf(a.name);
  const bIndex = ROOM_ORDER.indexOf(b.name);
  if (aIndex === -1 && bIndex === -1) return a.name.localeCompare(b.name);
  if (aIndex === -1) return 1;
  if (bIndex === -1) return -1;
  return aIndex - bIndex;
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
  // Age labels depend on the current time, so this data must render at request
  // time. The caller keeps it inside <Suspense> (Next.js 16 Cache Components).
  await connection();
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

  const rooms = (roomsResult.data as RoomRow[]).sort(sortRooms).map((room) => ({
    id: room.id,
    name: room.name,
    children: children.filter((child) => child.roomId === room.id),
  }));

  return { rooms, error: null };
}

export async function getRooms(): Promise<{
  rooms: RoomOptionItem[];
  error: string | null;
}> {
  // The room list depends on the authenticated user's daycare, so it must
  // render at request time. The caller keeps it inside <Suspense>.
  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    return {
      rooms: [],
      error: "No se pudieron cargar las salas. Intentá nuevamente.",
    };
  }

  const rooms = (data as RoomRow[]).sort(sortRooms).map((room) => ({
    id: room.id,
    name: room.name,
  }));

  return { rooms, error: null };
}

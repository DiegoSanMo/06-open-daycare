export type ParentStatus = "active" | "pending";

export type LinkedParent = {
  id: string;
  name: string;
  relation: string;
  status: ParentStatus;
  statusLabel: string;
  badgeLabel: string;
  initial: string;
  avatarBg: string;
  avatarFg?: string;
};

export type KidBadge = {
  label: string;
  tone: "allergy" | "action";
};

export type Kid = {
  id: string;
  name: string;
  initial: string;
  ageLabel: string;
  room: string;
  birthDateLabel: string;
  joinedLabel: string;
  linkedParentsLabel: string;
  linkedParents: LinkedParent[];
  allergiesNote?: string;
  listBadge?: KidBadge;
  avatarBg: string;
  avatarFg: string;
};

export const kids: Kid[] = [
  {
    id: "mateo-fernandez",
    name: "Mateo Fernández",
    initial: "M",
    ageLabel: "3 años",
    room: "Sala Soles",
    birthDateLabel: "12 mar 2022",
    joinedLabel: "feb 2025",
    linkedParentsLabel: "3 años · 2 padres vinculados",
    linkedParents: [
      {
        id: "lucia-fernandez",
        name: "Lucía Fernández",
        relation: "Mamá",
        status: "active",
        statusLabel: "activa",
        badgeLabel: "ACTIVA",
        initial: "L",
        avatarBg: "#C9B6E8",
      },
      {
        id: "diego-fernandez",
        name: "Diego Fernández",
        relation: "Papá",
        status: "pending",
        statusLabel: "invitación enviada",
        badgeLabel: "PENDIENTE",
        initial: "D",
        avatarBg: "#A9C7E8",
      },
    ],
    allergiesNote:
      "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.",
    listBadge: { label: "MANÍ", tone: "allergy" },
    avatarBg: "#A9D9E8",
    avatarFg: "#1F7A93",
  },
  {
    id: "sofia-mendez",
    name: "Sofía Méndez",
    initial: "S",
    ageLabel: "2 años",
    room: "Sala Soles",
    birthDateLabel: "4 ago 2023",
    joinedLabel: "mar 2025",
    linkedParentsLabel: "2 años · 1 padre vinculado",
    linkedParents: [
      {
        id: "ana-mendez",
        name: "Ana Méndez",
        relation: "Mamá",
        status: "active",
        statusLabel: "activa",
        badgeLabel: "ACTIVA",
        initial: "A",
        avatarBg: "#F4B8CC",
      },
    ],
    avatarBg: "#F4B8CC",
    avatarFg: "#C44A7A",
  },
  {
    id: "benjamin-ruiz",
    name: "Benjamín Ruiz",
    initial: "B",
    ageLabel: "3 años",
    room: "Sala Soles",
    birthDateLabel: "21 ene 2022",
    joinedLabel: "feb 2025",
    linkedParentsLabel: "3 años · 2 padres vinculados",
    linkedParents: [
      {
        id: "carla-ruiz",
        name: "Carla Ruiz",
        relation: "Mamá",
        status: "active",
        statusLabel: "activa",
        badgeLabel: "ACTIVA",
        initial: "C",
        avatarBg: "#B9DEC4",
      },
      {
        id: "martin-ruiz",
        name: "Martín Ruiz",
        relation: "Papá",
        status: "active",
        statusLabel: "activo",
        badgeLabel: "ACTIVA",
        initial: "M",
        avatarBg: "#A9C7E8",
      },
    ],
    avatarBg: "#B9DEC4",
    avatarFg: "#3E8B62",
  },
  {
    id: "valentina-soto",
    name: "Valentina Soto",
    initial: "V",
    ageLabel: "2 años",
    room: "Sala Soles",
    birthDateLabel: "15 nov 2023",
    joinedLabel: "abr 2025",
    linkedParentsLabel: "2 años · sin padres vinculados",
    linkedParents: [],
    listBadge: { label: "VINCULAR", tone: "action" },
    avatarBg: "#F4DC8E",
    avatarFg: "#9A7B1E",
  },
  {
    id: "tomas-diaz",
    name: "Tomás Díaz",
    initial: "T",
    ageLabel: "3 años",
    room: "Sala Soles",
    birthDateLabel: "9 may 2022",
    joinedLabel: "feb 2025",
    linkedParentsLabel: "3 años · 1 padre vinculado",
    linkedParents: [
      {
        id: "paula-diaz",
        name: "Paula Díaz",
        relation: "Mamá",
        status: "active",
        statusLabel: "activa",
        badgeLabel: "ACTIVA",
        initial: "P",
        avatarBg: "#C9B6E8",
      },
    ],
    allergiesNote: "Intolerancia a la lactosa. Evitar lácteos y derivados.",
    listBadge: { label: "LACTOSA", tone: "allergy" },
    avatarBg: "#C9B6E8",
    avatarFg: "#7B5FC0",
  },
  {
    id: "emma-castro",
    name: "Emma Castro",
    initial: "E",
    ageLabel: "2 años",
    room: "Sala Soles",
    birthDateLabel: "30 sep 2023",
    joinedLabel: "mar 2025",
    linkedParentsLabel: "2 años · 1 padre vinculado",
    linkedParents: [
      {
        id: "julia-castro",
        name: "Julia Castro",
        relation: "Mamá",
        status: "active",
        statusLabel: "activa",
        badgeLabel: "ACTIVA",
        initial: "J",
        avatarBg: "#F4B8CC",
      },
    ],
    avatarBg: "#F4B8CC",
    avatarFg: "#C44A7A",
  },
  {
    id: "lucas-romero",
    name: "Lucas Romero",
    initial: "L",
    ageLabel: "3 años",
    room: "Sala Soles",
    birthDateLabel: "2 feb 2022",
    joinedLabel: "feb 2025",
    linkedParentsLabel: "3 años · 1 padre vinculado",
    linkedParents: [
      {
        id: "soledad-romero",
        name: "Soledad Romero",
        relation: "Mamá",
        status: "active",
        statusLabel: "activa",
        badgeLabel: "ACTIVA",
        initial: "S",
        avatarBg: "#A9D9E8",
      },
    ],
    avatarBg: "#A9D9E8",
    avatarFg: "#1F7A93",
  },
  {
    id: "olivia-vega",
    name: "Olivia Vega",
    initial: "O",
    ageLabel: "2 años",
    room: "Sala Soles",
    birthDateLabel: "18 jul 2023",
    joinedLabel: "mar 2025",
    linkedParentsLabel: "2 años · 1 padre vinculado",
    linkedParents: [
      {
        id: "natalia-vega",
        name: "Natalia Vega",
        relation: "Mamá",
        status: "active",
        statusLabel: "activa",
        badgeLabel: "ACTIVA",
        initial: "N",
        avatarBg: "#B9DEC4",
      },
    ],
    avatarBg: "#B9DEC4",
    avatarFg: "#3E8B62",
  },
];

export function getKidById(id: string): Kid | undefined {
  return kids.find((kid) => kid.id === id);
}

export function getKidsCount(): number {
  return kids.length;
}

export const roomOptions = ["Soles", "Luna", "Estrellas"] as const;

export type RoomOption = (typeof roomOptions)[number];

export type AddKidFormValues = {
  name: string;
  birthDate: string; // "dd/mm/aaaa"
  room: RoomOption | ""; // "" = opción "Seleccione sala"
  allergies: string; // CSV separado por comas
  medicalNotes: string;
};

export function formatBirthDate(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function isValidBirthDate(value: string): boolean {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return false;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31) return false;

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export const parentRelationOptions = ["Mamá", "Papá", "Tutor/a"] as const;
export type ParentRelation = (typeof parentRelationOptions)[number];

// Persisted values are English; these labels are shown in the UI only.
export const relationshipLabels: Record<string, string> = {
  mother: "Mamá",
  father: "Papá",
  guardian: "Tutor/a",
};

export type LinkParentFormValues = {
  parentName: string; // "Ej. Diego Fernández"
  email: string; // "correo@ejemplo.com"
  relation: ParentRelation; // "Mamá" por defecto
};

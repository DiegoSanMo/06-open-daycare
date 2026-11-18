import { teacher } from "./teacher";

export type PostKind = "logro" | "actividad" | "anuncio";

export type FeedPost = {
  id: string;
  kind: PostKind;
  author: string;
  time: string;
  audience: string;
  body: string;
  likes: number;
  comments: number;
  photoLabel?: string;
};

export { teacher };

export const posts: FeedPost[] = [
  {
    id: "logro-orinal",
    kind: "logro",
    author: "Mateo",
    time: "14:20",
    audience: "familia de Mateo",
    body: "¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.",
    likes: 3,
    comments: 1,
  },
  {
    id: "actividad-temperas",
    kind: "actividad",
    author: "Mateo",
    time: "09:40",
    audience: "familia de Mateo",
    body: "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.",
    likes: 5,
    comments: 2,
    photoLabel: "Foto · pintando con témperas",
  },
  {
    id: "anuncio-parque",
    kind: "anuncio",
    author: "Anuncio general",
    time: "07:50",
    audience: "toda la sala",
    body: "El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.",
    likes: 8,
    comments: 0,
  },
];

export const postAudienceOptions = [
  { id: "mateo", label: "Mateo", initial: "M", avatarBg: "#A9D9E8", avatarFg: "#1F7A93" },
  { id: "sofia", label: "Sofía", initial: "S", avatarBg: "#F4B8CC", avatarFg: "#C44A7A" },
  { id: "benjamin", label: "Benjamín", initial: "B", avatarBg: "#B9DEC4", avatarFg: "#3E8B62" },
] as const;

export type PostAudienceId = (typeof postAudienceOptions)[number]["id"];

export const postTypeOptions = [
  { id: "comida", label: "Comida", bg: "#9A7B1E", fg: "#FFFFFF" },
  { id: "siesta", label: "Siesta", bg: "#E7DCF6", fg: "#7B5FC0" },
  { id: "actividad", label: "Actividad", bg: "#2E89A6", fg: "#FFFFFF" },
  { id: "logro", label: "Logro", bg: "#CFEBD8", fg: "#3E9B6C" },
  { id: "animo", label: "Ánimo", bg: "#F9D2DE", fg: "#C56486" },
  { id: "foto", label: "Foto", bg: "#FBD8CC", fg: "#D9684A" },
  { id: "anuncio", label: "Anuncio", bg: "#CCD8F4", fg: "#4E72C8" },
] as const;

export type PostTypeId = (typeof postTypeOptions)[number]["id"];

export type NewPostPhoto = { id: string; url: string; name: string };

export type NewPostFormValues = {
  audienceIds: PostAudienceId[];
  allRoom: boolean;
  type: PostTypeId | "";
  description: string;
  photos: NewPostPhoto[];
};

export const newPostPlaceholder = "Contá cómo le fue hoy…";

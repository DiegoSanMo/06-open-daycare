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

export const teacher = {
  name: "Caro Giménez",
  role: "Maestra · Soles",
  initial: "C",
  room: "Sala Soles",
  childrenCount: 12,
  dateLabel: "martes 17 jun",
} as const;

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

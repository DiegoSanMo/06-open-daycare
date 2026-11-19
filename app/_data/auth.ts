export type ActivationFixture = {
  inviteCode: string;
  email: string;
  password: string;
  childInitial: string;
  childLabel: string;
  invitationLabel: string;
  consentLabel: string;
};

export const activationFixture: ActivationFixture = {
  inviteCode: "7K4P9",
  email: "lucia.fernandez@gmail.com",
  password: "contraseña",
  childInitial: "M",
  childLabel: "Mateo · Sala Soles",
  invitationLabel: "Te invitaron a seguir a",
  consentLabel:
    "Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de la app.",
};

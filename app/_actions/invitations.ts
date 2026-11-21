"use server";

import { randomInt, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Resend } from "resend";

import { createClient } from "@/utils/supabase/server";

export type InvitationState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | {
      status: "sent";
      code: string;
      email: string;
      expiresAt: string;
      resendError?: string;
    };

export type InvitationPreview = {
  code: string;
  fullName: string;
  email: string;
  childName: string;
  roomName: string;
  expiresAt: string;
};

type Relationship = "father" | "mother" | "guardian";

type InvitationEmailInput = {
  email: string;
  fullName: string;
  childName: string;
  code: string;
  origin: string;
  idempotencyKey: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CODE_PATTERN = /^[A-Z0-9]{5}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CODE_LENGTH = 5;
const MAX_CODE_ATTEMPTS = 5;
const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const RESEND_ERROR_MESSAGE =
  "No se pudo enviar el correo. Podés reenviarlo cuando quieras.";

const RELATIONSHIP_VALUES: Record<string, Relationship> = {
  mother: "mother",
  mama: "mother",
  mamá: "mother",
  father: "father",
  papa: "father",
  papá: "father",
  guardian: "guardian",
  tutor: "guardian",
  "tutor/a": "guardian",
};

function textField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function errorState(message: string): InvitationState {
  return { status: "error", message };
}

function normalizeRelationship(value: string): Relationship | null {
  return RELATIONSHIP_VALUES[value.trim().toLowerCase()] ?? null;
}

function generateCode(): string {
  let code = "";
  for (let index = 0; index < CODE_LENGTH; index += 1) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function getOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (!host) return "http://localhost:3000";

  const forwardedProtocol = requestHeaders.get("x-forwarded-proto");
  const isLocal = /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host);
  const protocol =
    forwardedProtocol ?? (isLocal ? "http" : "https");

  return `${protocol}://${host}`;
}

function invitationHtml({
  fullName,
  childName,
  code,
  origin,
}: InvitationEmailInput): string {
  const activationLink = `${origin}/activate-account?code=${encodeURIComponent(code)}`;

  return `<div style="font-family:Arial,sans-serif;color:#3F362E;line-height:1.5">
  <h1 style="font-size:22px">Te invitaron a OpenDayCare</h1>
  <p>Hola ${escapeHtml(fullName)},</p>
  <p>Te invitaron para seguir a <strong>${escapeHtml(childName)}</strong> en OpenDayCare.</p>
  <p>Tu código de invitación es <strong style="font-size:18px;letter-spacing:3px">${code}</strong>.</p>
  <p><a href="${escapeHtml(activationLink)}">Activar mi cuenta</a></p>
  <p>El código y el enlace vencen en 7 días.</p>
</div>`;
}

async function sendInvitationEmail(
  input: InvitationEmailInput,
): Promise<string | null> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return "No se pudo enviar el correo: falta la configuración de Resend.";
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send(
      {
        from: process.env.RESEND_FROM ?? "OpenDayCare <onboarding@resend.dev>",
        to: [input.email],
        subject: "Tu invitación para OpenDayCare",
        html: invitationHtml(input),
      },
      { idempotencyKey: input.idempotencyKey },
    );

    return error ? RESEND_ERROR_MESSAGE : null;
  } catch {
    return RESEND_ERROR_MESSAGE;
  }
}

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims.sub) return null;
  return data.claims.sub;
}

export async function createInvitation(
  _prevState: InvitationState,
  formData: FormData,
): Promise<InvitationState> {
  const fullName = textField(formData, "fullName").trim();
  const email = textField(formData, "email").trim().toLowerCase();
  const relationship = normalizeRelationship(textField(formData, "relation"));
  const childId = textField(formData, "childId").trim();

  if (!fullName) return errorState("Ingresá el nombre del padre/madre.");
  if (!EMAIL_PATTERN.test(email)) return errorState("Ingresá un email válido.");
  if (!relationship) return errorState("Elegí un parentesco válido.");
  if (!UUID_PATTERN.test(childId)) {
    return errorState("El niño seleccionado no es válido.");
  }

  const userId = await currentUserId();
  if (!userId) return errorState("Tu sesión venció. Ingresá nuevamente.");

  const supabase = await createClient();
  const { data: child, error: childError } = await supabase
    .from("children")
    .select("id, full_name")
    .eq("id", childId)
    .maybeSingle();

  if (childError || !child) {
    return errorState("No se encontró el niño en tu guardería.");
  }

  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS).toISOString();
  let invitationId: string | null = null;
  let code = "";

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    const candidate = generateCode();
    const { data, error: insertError } = await supabase
      .from("invitations")
      .insert({
        child_id: childId,
        invited_by: userId,
        full_name: fullName,
        email,
        relationship,
        code: candidate,
        status: "pending",
        expires_at: expiresAt,
      })
      .select("id, code")
      .single();

    if (insertError) {
      // 23505 is the unique(code) collision; any other error is not retryable.
      if (insertError.code === "23505") continue;
      return errorState("No se pudo crear la invitación. Intentá nuevamente.");
    }

    invitationId = data.id;
    code = data.code;
    break;
  }

  if (!invitationId) {
    return errorState("No se pudo generar un código único. Intentá nuevamente.");
  }

  const resendError = await sendInvitationEmail({
    email,
    fullName,
    childName: child.full_name,
    code,
    origin: await getOrigin(),
    idempotencyKey: `invitation-created-${invitationId}`,
  });

  revalidatePath("/kids", "layout");

  if (resendError) {
    return { status: "sent", code, email, expiresAt, resendError };
  }
  return { status: "sent", code, email, expiresAt };
}

export async function resendInvitation(
  _prevState: InvitationState,
  formData: FormData,
): Promise<InvitationState> {
  const code = textField(formData, "code").trim().toUpperCase();

  if (!CODE_PATTERN.test(code)) {
    return errorState("El código de invitación no es válido.");
  }

  const userId = await currentUserId();
  if (!userId) return errorState("Tu sesión venció. Ingresá nuevamente.");

  const supabase = await createClient();
  const { data: invitation, error: invitationError } = await supabase
    .from("invitations")
    .select("id, code, email, full_name, expires_at, child_id")
    .eq("code", code)
    .eq("invited_by", userId)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (invitationError || !invitation) {
    return errorState("No se encontró una invitación vigente para reenviar.");
  }

  const { data: child } = await supabase
    .from("children")
    .select("full_name")
    .eq("id", invitation.child_id)
    .maybeSingle();

  const resendError = await sendInvitationEmail({
    email: invitation.email,
    fullName: invitation.full_name,
    childName: child?.full_name ?? "",
    code: invitation.code,
    origin: await getOrigin(),
    // A fresh key per click: Resend must deliver a new email, not replay the first.
    idempotencyKey: `invitation-resend-${invitation.id}-${randomUUID()}`,
  });

  revalidatePath("/kids", "layout");

  if (resendError) {
    return {
      status: "sent",
      code: invitation.code,
      email: invitation.email,
      expiresAt: invitation.expires_at,
      resendError,
    };
  }
  return {
    status: "sent",
    code: invitation.code,
    email: invitation.email,
    expiresAt: invitation.expires_at,
  };
}

export async function getInvitationPreview(
  code: string | null | undefined,
): Promise<InvitationPreview | null> {
  const normalized = code?.trim().toUpperCase() ?? "";

  if (!CODE_PATTERN.test(normalized)) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_invitation_preview", {
    p_code: normalized,
  });

  if (error || !Array.isArray(data) || data.length === 0) return null;

  const row = data[0] as Record<string, unknown>;
  return {
    code: String(row.code),
    fullName: String(row.full_name),
    email: String(row.email),
    childName: String(row.child_name),
    roomName: String(row.room_name),
    expiresAt: String(row.expires_at),
  };
}

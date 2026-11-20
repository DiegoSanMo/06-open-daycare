"use server";

import { revalidatePath } from "next/cache";

import { allergyTagsFromLabels } from "@/app/_data/children";
import { isValidBirthDate } from "@/app/_data/kids";
import { createClient } from "@/utils/supabase/server";

export type AddKidFieldErrors = {
  name?: string;
  birthDate?: string;
  room?: string;
};

export type AddKidState = {
  status: "idle" | "error" | "success";
  message: string;
  errors: AddKidFieldErrors;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function textField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function birthDateToIso(value: string): string {
  const [day, month, year] = value.split("/");
  return `${year}-${month}-${day}`;
}

function todayIso(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

export async function addKid(
  _prevState: AddKidState,
  formData: FormData,
): Promise<AddKidState> {
  const name = textField(formData, "name").trim();
  const birthDate = textField(formData, "birthDate").trim();
  const room = textField(formData, "room").trim();
  const allergies = textField(formData, "allergies");
  const medicalNotes = textField(formData, "medicalNotes").trim();

  const errors: AddKidFieldErrors = {};
  if (!name) errors.name = "Ingresá el nombre completo.";
  if (!birthDate) {
    errors.birthDate = "Ingresá la fecha de nacimiento.";
  } else if (!isValidBirthDate(birthDate)) {
    errors.birthDate = "La fecha no es válida. Usá dd/mm/aaaa.";
  }
  if (!room) {
    errors.room = "Elegí una sala.";
  } else if (!UUID_PATTERN.test(room)) {
    errors.room = "Elegí una sala válida.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      status: "error",
      message: "Revisá los campos marcados.",
      errors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("children").insert({
    room_id: room,
    full_name: name,
    birth_date: birthDateToIso(birthDate),
    enrolled_at: todayIso(),
    medical_notes: medicalNotes || null,
    allergy_tags: allergyTagsFromLabels(allergies),
  });

  if (error) {
    return {
      status: "error",
      message: "No se pudo agregar el niño. Intentá nuevamente.",
      errors: {},
    };
  }

  revalidatePath("/kids");

  return { status: "success", message: "", errors: {} };
}

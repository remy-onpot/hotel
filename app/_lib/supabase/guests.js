import "server-only";
import { privilegedQuery } from "./supabaseRiskyClient";

import { privilegedGuestByEmail, privilegedGuestById, privilegedGuestPasswordByEmail, privilegedCreateGuest } from "./supabaseRiskyClient";
export async function getGuestById(id) {
  if (!/^\d+$/.test(String(id ?? ""))) return null;

  const { data: guest, error } = await privilegedGuestById(Number(id));

  if (error) throw new Error(`Unable to load guest: ${error.message}`);
  return guest;
}

export async function getGuestByEmail(email) {
  if (typeof email !== "string" || !email.trim()) return null;

  const { data: guest, error } = await privilegedGuestByEmail(email.trim());

  if (error) {
    throw new Error(`Unable to load guest: ${error.message}`);
  }

  return guest;
}

export async function getFullGuestByEmail(email) {
  const { data: guests, error } = await privilegedGuestPasswordByEmail(email);
  if (error?.code === "PGRST116") return null;
  if (error) throw new Error("Unable to authenticate guest.");
  return guests;
}

export async function updateGuest(
  id,
  name,
  nationality,
  countryFlag,
  phone,
  nationalID
) {
  const { data, error } = await privilegedQuery("guests")
    .update({
      fullname: name,
      nationality,
      phone,
      countryFlag,
      nationalID,
    })
    .eq("id", id)
    .select();

  return { data, error };
}

export async function updateGuestContact(id, name, phone) {
  const { data, error } = await privilegedQuery("guests")
    .update({ fullname: name, phone })
    .eq("id", id)
    .select();

  return { data, error };
}

export async function updateGuestWithPwd(
  id,
  name,
  nationality,
  countryFlag,
  phone,
  password
) {
  const { data, error } = await privilegedQuery("guests")
    .update({
      fullname: name,
      nationality,
      phone,
      countryFlag,
      password,
    })
    .eq("id", id)
    .select();

  return { data, error };
}

export async function createGuest(
  fullname,
  email,
  avatar = "",
  password = "",
  phone = "",
  nationality = "",
  countryFlag = "",
  nationalID = ""
) {
  const { data, error } = await privilegedCreateGuest(
      {
        fullname,
        email,
        phone,
        avatar,
        nationality,
        countryFlag,
        nationalID,
        password,
      }
    );

  return { data, error };
}

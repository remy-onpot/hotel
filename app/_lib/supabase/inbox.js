import { privilegedInsertInbox } from "./supabaseRiskyClient";

export async function createMessage({ fullname, email, phone, message }) {
  const { data, error } = await privilegedInsertInbox({ fullname, email, phone, message });
  if (error) throw new Error("Could not save the message.");
  if (!data?.ok) {
    if (data?.code === "RATE_LIMITED") throw new Error("Please wait before sending another enquiry from this email address.");
    throw new Error("Please check your contact details and try again.");
  }
  return data;
}

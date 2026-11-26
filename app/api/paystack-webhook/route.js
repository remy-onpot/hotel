import { NextResponse } from "next/server";
import { verifyAndSavePaystackReservation, verifyPaystackWebhookSignature } from "@/app/_lib/paystack";

export const runtime = "nodejs";

export async function POST(request) {
  const rawBody = await request.text();
  if (!verifyPaystackWebhookSignature(rawBody, request.headers)) {
    return NextResponse.json({ message: "Invalid webhook signature." }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ message: "Invalid webhook payload." }, { status: 400 });
  }

  if (event.event !== "charge.success") return NextResponse.json({ received: true });

  try {
    await verifyAndSavePaystackReservation(event.data?.reference);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook processing failed; inspect payment status in the provider dashboard.");
    return NextResponse.json({ message: "Could not process the payment yet." }, { status: 500 });
  }
}

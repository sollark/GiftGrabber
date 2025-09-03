"use client";
import OrderPageClient from "./OrderPageClient";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ eventId: string; publicOrderId: string }>;
}) {
  const { eventId, publicOrderId } = await params;
  return <OrderPageClient eventId={eventId} publicOrderId={publicOrderId} />;
}

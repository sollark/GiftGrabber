"use client";
import OrderPageClient from "./OrderPageClient";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ eventId: string; orderId: string }>;
}) {
  const { eventId, orderId } = await params;
  return <OrderPageClient eventId={eventId} orderId={orderId} />;
}

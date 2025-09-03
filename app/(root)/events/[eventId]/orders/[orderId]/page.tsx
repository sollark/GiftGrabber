"use client";
import OrderPageClient from "./OrderPageClient";

/**
 * OrderPage
 * Loads order details and delegates rendering to OrderPageClient.
 * @param params - Route parameters containing eventId and publicOrderId
 * @returns JSX.Element
 * @publicAPI
 */
export default async function OrderPage({
  params,
}: {
  params: Promise<{ eventId: string; publicOrderId: string }>;
}) {
  const { eventId, publicOrderId } = await params;
  return <OrderPageClient eventId={eventId} publicOrderId={publicOrderId} />;
}

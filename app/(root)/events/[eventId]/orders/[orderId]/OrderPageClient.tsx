"use client";
import ConfirmOrder from "@/components/order/ConfirmOrder";

interface OrderPageClientProps {
  eventId: string;
  publicOrderId: string;
}

/**
 * OrderPageClient
 * Client component for rendering order confirmation UI.
 * @param eventId - Event identifier
 * @param publicOrderId - Public order identifier
 * @returns JSX.Element
 * @publicAPI
 */
export default function OrderPageClient({
  eventId,
  publicOrderId,
}: OrderPageClientProps) {
  return <ConfirmOrder publicOrderId={publicOrderId} eventId={eventId} />;
}

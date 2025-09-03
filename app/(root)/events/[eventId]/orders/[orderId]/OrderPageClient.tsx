"use client";
import ConfirmOrder from "@/components/order/ConfirmOrder";

interface OrderPageClientProps {
  eventId: string;
  publicOrderId: string;
}

/**
 * Client component for rendering order confirmation UI.
 * Props:
 *   - eventId: string
 *   - publicOrderId: string
 * Returns: JSX.Element
 */
export default function OrderPageClient({
  eventId,
  publicOrderId,
}: OrderPageClientProps) {
  return <ConfirmOrder publicOrderId={publicOrderId} eventId={eventId} />;
}

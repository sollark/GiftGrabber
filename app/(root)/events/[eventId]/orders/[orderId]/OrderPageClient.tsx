"use client";
import ConfirmOrder from "@/components/order/ConfirmOrder";

interface OrderPageClientProps {
  eventId: string;
  orderId: string;
}

/**
 * Client component for rendering order confirmation UI.
 * Props:
 *   - eventId: string
 *   - orderId: string
 * Returns: JSX.Element
 */
export default function OrderPageClient({
  eventId,
  orderId,
}: OrderPageClientProps) {
  return <ConfirmOrder orderId={orderId} eventId={eventId} />;
}

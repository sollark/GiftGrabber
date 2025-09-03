"use client";

import OrderDetails from "@/components/order/OrderDetails";

export interface OrderPageClientProps {
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
const OrderPageClient = ({ eventId, publicOrderId }: OrderPageClientProps) => {
  return <OrderDetails publicOrderId={publicOrderId} eventId={eventId} />;
};

export default OrderPageClient;

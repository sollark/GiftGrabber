"use client";
import { useEffect, useState } from "react";
import OrderPageClient from "./OrderPageClient";

/**
 * OrderPage
 * Loads order details and delegates rendering to OrderPageClient.
 * @param params - Route parameters containing eventId and publicOrderId
 * @returns JSX.Element
 * @publicAPI
 */
export default function OrderPage({
  params,
}: {
  params: Promise<{ eventId: string; publicOrderId: string }>;
}) {
  const [routeParams, setRouteParams] = useState<{
    eventId: string;
    publicOrderId: string;
  } | null>(null);

  useEffect(() => {
    params.then(setRouteParams);
  }, [params]);

  if (!routeParams) return <div>Loading...</div>;

  return (
    <OrderPageClient
      eventId={routeParams.eventId}
      publicOrderId={routeParams.publicOrderId}
    />
  );
}

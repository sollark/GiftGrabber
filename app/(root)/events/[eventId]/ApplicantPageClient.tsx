"use client";
/**
 * ApplicantPageClient.tsx
 *
 * Purpose: Renders the applicant event details and order workflow for a specific event.
 *
 * Responsibilities:
 * - Receives minimal event data (publicId, name, email) as props
 * - Sets up the OrderProvider context for order-related state
 * - Displays the event name and the OrderGifts component
 * - Does not handle applicant/approver/gift data (empty arrays used)
 *
 */
import { Section } from "@/ui/layout";
import OrderGifts from "@/components/order/OrderGifts";
import { isSome } from "@/utils/fp";
import { OrderProvider } from "@/app/contexts/order/OrderContext";
import { useEventSelector } from "@/app/contexts/EventContext";

/**
 * ApplicantPageClient
 *
 * Renders the event name and sets up the order context for the applicant workflow.
 *
 * @param event - Minimal event data (publicId, name, email)
 * @returns JSX.Element containing the event title and order workflow
 */
export default function ApplicantPageClient() {
  const eventMaybe = useEventSelector((state) => state.data);
  const event = isSome(eventMaybe) ? eventMaybe.value : undefined;

  return (
    <OrderProvider>
      <Section>
        <Section.Title>{event?.name || "Event"}</Section.Title>
        <OrderGifts />
      </Section>
    </OrderProvider>
  );
}

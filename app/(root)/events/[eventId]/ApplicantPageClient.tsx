"use client";
import Section from "@/components/Section";
import OrderGifts from "@/components/order/OrderGifts";
import type { Event } from "@/database/models/event.model";

interface ApplicantPageClientProps {
  event: Event;
}

/**
 * Client component for rendering applicant event details and gifts.
 * Props:
 *   - event: EventType
 * Returns: JSX.Element
 */
export default function ApplicantPageClient({
  event,
}: ApplicantPageClientProps) {
  return (
    <Section>
      <Section.Title>{event.name}</Section.Title>
      <OrderGifts event={event} />
    </Section>
  );
}

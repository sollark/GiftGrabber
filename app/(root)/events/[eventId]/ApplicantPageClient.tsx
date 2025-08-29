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
import { OrderStatus } from "@/types/common.types";

// Only these fields are expected in event:
// - publicId: string
// - name: string
// - email: string
interface ApplicantPageClientProps {
  event: {
    publicId: string;
    name: string;
    email: string;
  };
}

/**
 * ApplicantPageClient
 *
 * Renders the event name and sets up the order context for the applicant workflow.
 *
 * @param event - Minimal event data (publicId, name, email)
 * @returns JSX.Element containing the event title and order workflow
 */
export default function ApplicantPageClient({
  event,
}: ApplicantPageClientProps) {
  // Prepare order context data (no gifts/applicants/approvers available)
  const orderData = {
    publicId: `order-${Date.now()}`,
    createdAt: new Date(),
    applicant: null as any, // To be selected by user in workflow
    gifts: [],
    orderId: `order-${Date.now()}`,
    confirmationRQCode: "",
    confirmedByApprover: null,
    status: OrderStatus.PENDING,
  };

  // No approver/applicant data available, so use empty array
  const approverList: any[] = [];

  return (
    <Section>
      <Section.Title>{event.name}</Section.Title>
      <OrderGifts />
    </Section>
  );
}

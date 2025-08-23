"use client";
import { Section } from "@/ui/layout";
import OrderGifts from "@/components/order/OrderGifts";
import { OrderProvider } from "@/app/contexts/order/OrderContext";
import { OrderStatus } from "@/types/common.types";
import type { Event } from "@/database/models/event.model";

interface ApplicantPageClientProps {
  event: Event;
}

/**
 * Client component for rendering applicant event details and gifts with proper OrderContext setup.
 *
 * @param event - Event data containing gifts and applicants for order initialization
 * @returns JSX.Element with OrderProvider wrapping OrderGifts for proper context access
 *
 * Architecture:
 * - Sets up OrderProvider with event-based order data
 * - Provides event gifts and applicants as order context data
 * - Enables OrderGifts to access OrderContext without errors
 */
export default function ApplicantPageClient({
  event,
}: ApplicantPageClientProps) {
  // Create order data from event for OrderProvider initialization
  const orderData = {
    publicId: `order-${Date.now()}`,
    createdAt: new Date(),
    applicant: null as any, // Will be selected by user in the workflow
    gifts: event.giftList || [],
    orderId: `order-${Date.now()}`,
    confirmationRQCode: "",
    confirmedByApprover: null,
    status: OrderStatus.PENDING,
  };

  // Use event applicants as approver list for order approval workflow
  const approverList = event.approverList || event.applicantList || [];
  return (
    <Section>
      <Section.Title>{event.name}</Section.Title>
      <OrderProvider order={orderData} approverList={approverList}>
        <OrderGifts />
      </OrderProvider>
    </Section>
  );
}

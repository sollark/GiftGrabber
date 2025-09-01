/**
 * ConfirmOrder.tsx
 *
 * This file defines the ConfirmOrder component, which is responsible for rendering the order confirmation flow in the Gift Grabber app.
 * It fetches order and approver data, handles loading and error states, and composes the UI using context providers and subcomponents.
 *
 * Responsibilities:
 * - Fetch order and approver data for a given event/order
 * - Handle loading, error, and not-found states
 * - Provide order/approver context to child components
 * - Render the multi-step order confirmation UI
 *
 * Constraints:
 * - No new UI or styling changes
 * - No new features or business logic
 * - Only code quality, structure, and documentation improvements
 */

"use client";

import { getEventApprovers } from "@/app/actions/event.action";
import { getOrder } from "@/app/actions/order.action";
import { OrderProvider } from "@/app/contexts/order/OrderContext";
import { Order } from "@/database/models/order.model";
import { FC } from "react";
import useSWR from "swr";
import Approver from "../approver/Approver";
import { ConfirmOrderButton } from "@/ui/primitives";
import MultistepNavigator from "@/ui/navigation/MultistepNavigator";
import OrderDetails from "./OrderDetails";
import { useApplicantSelector } from "@/app/contexts/ApplicantContext";
import { useApproverSelection } from "@/app/contexts/ApproverContext";

// --- Constants ---
const SWR_CONFIG = {
  REVALIDATE_ON_FOCUS: false,
} as const;

const UI_MESSAGES = {
  LOADING: "Loading...",
  ORDER_ERROR: "Error loading order",
  ORDER_NOT_FOUND: "Order not found",
  APPROVERS_ERROR: "Error loading approvers",
  EVENT_NOT_FOUND: "Event not found",
} as const;

// --- Types ---
/**
 * Props for ConfirmOrder component
 * @property eventId - The event ID
 * @property orderId - The order ID
 */
type ConfirmOrderProps = {
  eventId: string;
  orderId: string;
};

/**
 * ConfirmOrder component
 * Fetches order and approver data, handles loading/error states, and renders the order confirmation UI.
 * @param eventId - The event ID
 * @param orderId - The order ID
 * @returns The order confirmation UI or appropriate loading/error state
 */
const ConfirmOrder: FC<ConfirmOrderProps> = ({ eventId, orderId }) => {
  // Context hooks (used for side effects or future extensibility)
  // useApplicantSelector(); // Removed: requires selector argument
  useApproverSelection();

  // Fetch order data with SWR
  const {
    data: order,
    error: orderError,
    isValidating: orderLoading,
  } = useSWR(
    () => createOrderCacheKey(orderId),
    () => getOrder(orderId),
    { revalidateOnFocus: SWR_CONFIG.REVALIDATE_ON_FOCUS }
  );

  // Fetch approvers data with SWR
  const {
    data: approvers,
    error: approversError,
    isValidating: approversLoading,
  } = useSWR(
    () => createEventCacheKey(eventId),
    () => getEventApprovers(eventId),
    { revalidateOnFocus: SWR_CONFIG.REVALIDATE_ON_FOCUS }
  );

  // Simplified error and loading state handling with early returns
  if (orderLoading || approversLoading) {
    return <div>{UI_MESSAGES.LOADING}</div>;
  }

  if (orderError) {
    return <div>{UI_MESSAGES.ORDER_ERROR}</div>;
  }

  if (!order) {
    return <div>{UI_MESSAGES.ORDER_NOT_FOUND}</div>;
  }

  if (approversError) {
    return <div>{UI_MESSAGES.APPROVERS_ERROR}</div>;
  }

  if (!approvers) {
    return <div>{UI_MESSAGES.EVENT_NOT_FOUND}</div>;
  }

  // Type guard for Order object
  const isValidOrder = (obj: any): obj is Order => {
    return (
      obj &&
      typeof obj === "object" &&
      typeof obj._id === "string" &&
      typeof obj.createdAt !== "undefined" &&
      typeof obj.applicant !== "undefined" &&
      Array.isArray(obj.gifts)
    );
  };

  // Validate order structure before rendering
  if (!isValidOrder(order) || !Array.isArray(approvers)) {
    return null;
  }

  return (
    <OrderProvider>
      <MultistepNavigator>
        <Approver />
        <OrderConfirmationSection />
      </MultistepNavigator>
    </OrderProvider>
  );
};

/**
 * OrderConfirmationSection
 * Renders the order details and the confirm order button.
 * @returns JSX for the order confirmation section
 */
const OrderConfirmationSection: FC = () => (
  <>
    <OrderDetails />
    <ConfirmOrderButton />
  </>
);

/**
 * Creates a cache key for order data fetching
 * @param orderId - The order ID
 * @returns Cache key string for SWR
 */
const createOrderCacheKey = (orderId: string): string => `orders/${orderId}`;

/**
 * Creates a cache key for approvers data fetching
 * @param eventId - The event ID
 * @returns Cache key string for SWR
 */
const createEventCacheKey = (eventId: string): string =>
  `events/${eventId}/approvers`;

export default ConfirmOrder;

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
import { FC, useMemo, ReactElement } from "react";
import useSWR from "swr";
import Approver from "../approver/Approver";
import { ConfirmOrderButton } from "@/ui/primitives";
import MultistepNavigator from "../../ui/navigation/MultistepNavigator";
import OrderDetails from "./OrderDetails";
import { useApplicantSelection } from "@/app/contexts/ApplicantContext";
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
  useApplicantSelection();
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

  // Memoize loading and error states for better performance
  const loadingState = useMemo(
    () => ({
      isLoading: orderLoading || approversLoading,
      hasOrderError: !!orderError,
      hasApproversError: !!approversError,
      hasOrder: Boolean(order),
      hasApprovers: Boolean(approvers),
    }),
    [
      orderLoading,
      approversLoading,
      orderError,
      approversError,
      order,
      approvers,
    ]
  );

  // Handle loading and error states
  const errorComponent = getErrorComponent(loadingState);
  if (errorComponent) return errorComponent;

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

  // Only render OrderProvider if order and approvers are present and valid
  if (!isValidOrder(order) || !Array.isArray(approvers)) return null;

  return (
    <OrderProvider order={order as Order} approverList={approvers}>
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

/**
 * LoadingState
 * Interface for loading and error state tracking.
 */
interface LoadingState {
  isLoading: boolean;
  hasOrderError: any;
  hasApproversError: any;
  hasOrder: boolean;
  hasApprovers: boolean;
}

/**
 * getErrorComponent
 * Determines and returns the appropriate error component based on loading state.
 * @param loadingState - Current loading and error state
 * @returns React element for error/loading state or null if no error
 */
const getErrorComponent = (loadingState: LoadingState): ReactElement | null => {
  const {
    isLoading,
    hasOrderError,
    hasApproversError,
    hasOrder,
    hasApprovers,
  } = loadingState;

  if (isLoading) return <div>{UI_MESSAGES.LOADING}</div>;
  if (hasOrderError) return <div>{UI_MESSAGES.ORDER_ERROR}</div>;
  if (!hasOrder) return <div>{UI_MESSAGES.ORDER_NOT_FOUND}</div>;
  if (hasApproversError) return <div>{UI_MESSAGES.APPROVERS_ERROR}</div>;
  if (!hasApprovers) return <div>{UI_MESSAGES.EVENT_NOT_FOUND}</div>;
  return null;
};

export default ConfirmOrder;

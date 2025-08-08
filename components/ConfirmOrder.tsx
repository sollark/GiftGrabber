"use client";

import { getEventApprovers } from "@/app/actions/event.action";
import { getOrder } from "@/app/actions/order.action";
import { OrderProvider } from "@/app/contexts/OrderContext";
import { FC, useMemo, ReactElement } from "react";
import useSWR from "swr";
import Approver from "./Approver";
import ConfirmOrderButton from "./buttons/ConfirmOrderButton";
import MultistepNavigator from "./MultistepNavigator";
import OrderDetails from "./OrderDetails";
import { useApplicantSelection } from "@/app/contexts/ApplicantContext";
import { useApproverSelection } from "@/app/contexts/ApproverContext";

/**
 * Configuration constants for the ConfirmOrder component
 */
const SWR_CONFIG = {
  REVALIDATE_ON_FOCUS: false,
} as const;

/**
 * UI messages for different loading and error states
 */
const UI_MESSAGES = {
  LOADING: "Loading...",
  ORDER_ERROR: "Error loading order",
  ORDER_NOT_FOUND: "Order not found",
  APPROVERS_ERROR: "Error loading approvers",
  EVENT_NOT_FOUND: "Event not found",
} as const;

type ConfirmOrderProps = {
  eventId: string;
  orderId: string;
};

const ConfirmOrder: FC<ConfirmOrderProps> = ({
  eventId,
  orderId,
}: ConfirmOrderProps) => {
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
      hasOrderError: orderError,
      hasApproversError: approversError,
      hasOrder: !!order,
      hasApprovers: !!approvers,
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

  // Handle early returns for loading and error states
  const errorComponent = getErrorComponent(loadingState);
  if (errorComponent) return errorComponent;

  const { selectedApplicant } = useApplicantSelection();
  const { selectedApprover } = useApproverSelection();

  const applicant =
    selectedApplicant._tag === "Some" && selectedApplicant.value._tag === "Some"
      ? selectedApplicant.value.value
      : null;

  const approver =
    selectedApprover._tag === "Some" && selectedApprover.value._tag === "Some"
      ? selectedApprover.value.value
      : null;

  return (
    <OrderProvider order={order!} approverList={approvers!}>
      <MultistepNavigator>
        <Approver />
        <OrderConfirmationSection />
      </MultistepNavigator>
    </OrderProvider>
  );
};

/**
 * Renders the order confirmation section with details and button
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
 * Loading state interface for better type safety
 */
interface LoadingState {
  isLoading: boolean;
  hasOrderError: any;
  hasApproversError: any;
  hasOrder: boolean;
  hasApprovers: boolean;
}

/**
 * Determines and returns the appropriate error component based on loading state
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

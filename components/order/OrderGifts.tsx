/**
 * App Flow for OrderGifts
 *
 * Uses event data from order context instead of props. All event-related data is accessed via context.
 *
 * 1. Wraps the UI in ApplicantProvider, which manages applicant/gift state and actions via context.
 * 2. Renders MultistepNavigator to guide the user through the ordering process:
 *    a. Applicant: User selects the recipient (applicant) for the gifts.
 *    b. SelectUnclaimedGift: User picks unclaimed gifts for the selected applicant.
 *    c. GiftInfo: Shows info about the first unclaimed gift for the selected person.
 *    d. GiftList: Shows all selected gifts, allows removal, and provides a button to submit the order.
 * 3. On order submission (in GiftList):
 *    - Generates a QR code for the order.
 *    - Calls the backend to create the order.
 *    - Redirects the user to the order page if successful.
 *
 * In summary: The user selects a recipient, picks gifts, reviews them, and submits the order—all managed with React context and a multi-step UI.
 */

"use client";
import React, { FC } from "react";
import { ApplicantProvider } from "@/app/contexts/ApplicantContext";
import { GiftProvider } from "@/app/contexts/gift/GiftContext";
import { ApproverProvider } from "@/app/contexts/ApproverContext";
import MultistepNavigator from "../../ui/navigation/MultistepNavigator";
import SelectUnclaimedGift from "./SelectUnclaimedGift";
import Applicant from "../applicant/Applicant";
import GiftInfo from "../gift/GiftInfo";
import GiftList from "../gift/SelectedGiftList";
import { useOrderContext } from "@/app/contexts/order/OrderContext";

/**
 * OrderContextsProvider (Internal Component)
 * Composed provider that wraps multiple order-related contexts in the correct order.
 * Reduces provider nesting and improves readability.
 * @param order - Order data containing applicant and gifts
 * @param approverList - List of available approvers
 * @param children - Child components to render
 * @returns JSX with composed context providers
 */
interface OrderContextsProviderProps {
  order: any;
  approverList: any[];
  children: React.ReactNode;
}

const OrderContextsProvider: React.FC<OrderContextsProviderProps> = React.memo(
  ({ order, approverList, children }) => (
    <ApproverProvider approverList={approverList}>
      <ApplicantProvider applicantList={[order.applicant]}>
        <GiftProvider giftList={order.gifts}>{children}</GiftProvider>
      </ApplicantProvider>
    </ApproverProvider>
  )
);

OrderContextsProvider.displayName = "OrderContextsProvider";

/**
 * Functional OrderGifts component.
 * Wraps the ordering flow in context providers and a multi-step UI.
 * Uses event data from order context to avoid prop drilling.
 * @returns {JSX.Element} The rendered component.
 */
const OrderGifts: FC = () => {
  const orderContext = useOrderContext();

  // Handle Maybe type safely - extract data from context state
  if (orderContext._tag === "None") {
    return <div>Order context not available</div>;
  }

  const { order, approverList } = orderContext.value.state.data;
  if (!order) return null;

  return (
    <OrderContextsProvider order={order} approverList={approverList}>
      <MultistepNavigator>
        <Applicant />
        <>
          <SelectUnclaimedGift />
          <GiftInfo />
          <GiftList />
        </>
      </MultistepNavigator>
    </OrderContextsProvider>
  );
};

export default OrderGifts;

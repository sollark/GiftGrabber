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
import GiftList from "../gift/GiftList";
import { useOrderContext } from "@/app/contexts/order/OrderContext";

/**
 * Functional OrderGifts component.
 * Wraps the ordering flow in context providers and a multi-step UI.
 * Uses event data from order context to avoid prop drilling.
 * @returns {JSX.Element} The rendered component.
 */
const OrderGifts: FC = () => {
  const { order } = useOrderContext();
  // All event data is now accessed from order context

  if (!order) return null;

  return (
    <ApproverProvider approverList={order.approverList} eventId={order.eventId}>
      <ApplicantProvider
        eventId={order.eventId}
        applicantList={order.applicantList}
      >
        <GiftProvider giftList={order.giftList}>
          <MultistepNavigator>
            <Applicant />
            <>
              <SelectUnclaimedGift />
              <GiftInfo />
              <GiftList />
            </>
          </MultistepNavigator>
        </GiftProvider>
      </ApplicantProvider>
    </ApproverProvider>
  );
};

export default OrderGifts;

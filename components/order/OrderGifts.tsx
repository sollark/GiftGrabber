/**
 * App Flow for OrderGifts
 *
 * 1. Receives an event object with all necessary data (applicants, approvers, gifts).
 * 2. Wraps the UI in ApplicantProvider, which manages applicant/gift state and actions via context.
 * 3. Renders MultistepNavigator to guide the user through the ordering process:
 *    a. Applicant: User selects the recipient (applicant) for the gifts.
 *    b. SelectUnclaimedGift: User picks unclaimed gifts for the selected applicant.
 *    c. GiftInfo: Shows info about the first unclaimed gift for the selected person.
 *    d. GiftList: Shows all selected gifts, allows removal, and provides a button to submit the order.
 * 4. On order submission (in GiftList):
 *    - Generates a QR code for the order.
 *    - Calls the backend to create the order.
 *    - Redirects the user to the order page if successful.
 *
 * In summary: The user selects a recipient, picks gifts, reviews them, and submits the order—all managed with React context and a multi-step UI.
 */

"use client";
import { FC } from "react";
import { ApplicantProvider } from "@/app/contexts/ApplicantContext";
import { GiftProvider } from "@/app/contexts/GiftContext";
import { ApproverProvider } from "@/app/contexts/ApproverContext";
import { Event } from "@/database/models/event.model";
import MultistepNavigator from "../../ui/navigation/MultistepNavigator";
import SelectUnclaimedGift from "../SelectUnclaimedGift";
import Applicant from "./Applicant";
import GiftInfo from "./GiftInfo";
import GiftList from "./GiftList";

type OrderGiftsProps = {
  event: Event;
};

/**
 * Functional OrderGifts component.
 * Wraps the ordering flow in context providers and a multi-step UI.
 * Uses memo and strict typing for composability and performance.
 */
const OrderGifts: FC<OrderGiftsProps> = ({ event }) => (
  <ApproverProvider approverList={event.approverList} eventId={event.eventId}>
    <ApplicantProvider
      eventId={event.eventId}
      applicantList={event.applicantList}
    >
      <GiftProvider giftList={event.giftList}>
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

export default OrderGifts;

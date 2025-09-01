"use client";
/**
 * OrderGifts.tsx
 *
 * Purpose: Multi-step order workflow component for the gift ordering process.
 *
 * Responsibilities:
 * - Orchestrates the multi-step workflow (applicant selection → gift selection → order submission)
 * - Renders workflow steps that consume OrderContext selectors
 */

import React, { FC } from "react";
import MultistepNavigator from "@/ui/navigation/MultistepNavigator";
import Applicant from "../applicant/Applicant";
import SelectUnclaimedGift from "./SelectUnclaimedGift";
import SelectedGiftList from "../gift/SelectedGiftList";

/**
 * WorkflowSteps
 * Multi-step workflow component containing all order process steps.
 * Steps:
 * 1. Applicant selection
 * 2. Gift selection
 * 3. Gift information
 * 4. Gift list and order submission
 * @returns {JSX.Element} The complete multi-step ordering workflow.
 */
const WorkflowSteps: FC = () => {
  return (
    <MultistepNavigator>
      <Applicant />
      <>
        <SelectUnclaimedGift />
        <SelectedGiftList />
      </>
    </MultistepNavigator>
  );
};

/**
 * OrderGifts
 * Main component that renders the multi-step gift ordering workflow.
 * - Expects OrderContext to be properly set up by parent components.
 * - Throws error if OrderContext or order data is missing.
 * @returns {JSX.Element} The complete ordering interface.
 */
const OrderGifts: FC = () => {
  return <WorkflowSteps />;
};

export default OrderGifts;

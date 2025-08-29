"use client";
/**
 * OrderGifts.tsx
 *
 * Purpose: Multi-step order workflow component that uses OrderContext for gift selection and ordering process
 *
 * Main Responsibilities:
 * - Orchestrates the multi-step ordering workflow (applicant selection → gift selection → order submission)
 * - Uses OrderContext directly for all state management, eliminating context provider duplication
 * - Renders workflow steps that consume OrderContext selectors for optimal performance
 *
 * Architecture Role:
 * - Direct consumer of OrderContext for streamlined data flow
 * - Multi-step UI orchestrator without intermediate context layers
 * - Requires OrderContext to be properly set up in parent components
 */

import React, { FC } from "react";
import { useOrderContext } from "@/app/contexts/order/OrderContext";
import MultistepNavigator from "@/ui/navigation/MultistepNavigator";
import Applicant from "../applicant/Applicant";
import SelectUnclaimedGift from "./SelectUnclaimedGift";
import GiftInfo from "../gift/GiftInfo";
import GiftList from "../gift/SelectedGiftList";

// ============================================================================
// WORKFLOW COMPONENTS
// ============================================================================

/**
 * Multi-step workflow component containing all order process steps
 *
 * @returns JSX.Element with the complete multi-step ordering workflow
 *
 * Workflow Steps:
 * 1. Applicant selection - Choose the gift recipient from OrderContext
 * 2. Gift selection - Select unclaimed gifts from OrderContext
 * 3. Gift information - Review gift details from OrderContext
 * 4. Gift list - Final review and order submission using OrderContext
 */
const WorkflowSteps: FC = () => (
  <MultistepNavigator>
    <Applicant />
    <>
      <SelectUnclaimedGift />
      <GiftInfo />
      <GiftList />
    </>
  </MultistepNavigator>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Main OrderGifts component that renders the multi-step gift ordering workflow
 *
 * @returns JSX.Element containing the complete ordering interface
 *
 * Behavior:
 * - Expects OrderContext to be properly set up by parent components
 * - Renders the multi-step workflow directly without intermediate context providers
 * - Child components use OrderContext selectors for optimal performance
 *
 * Context Dependencies:
 * - OrderContext (required) - Must be provided by parent component
 * - All workflow steps consume OrderContext directly for streamlined data flow
 *
 * @throws Error if OrderContext is not available - indicates improper app setup
 */
const OrderGifts: FC = () => {
  const orderContext = useOrderContext();

  // OrderContext is required - if not available, it's an app configuration issue
  if (orderContext._tag === "None") {
    throw new Error(
      "OrderGifts requires OrderContext to be provided by a parent component. " +
        "Please ensure OrderProvider is set up in the component tree."
    );
  }

  // Extract order data from context for validation
  const { order } = orderContext.value.state.data;

  // Order data is required for the workflow
  if (!order) {
    throw new Error(
      "OrderGifts requires valid order data from OrderContext. " +
        "Please ensure OrderProvider is initialized with proper order data."
    );
  }

  return <WorkflowSteps />;
};

export default OrderGifts;

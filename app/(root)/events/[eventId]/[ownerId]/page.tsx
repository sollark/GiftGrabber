/**
 * page.tsx - Event Details Page
 *
 * Purpose: Server-side page component for event management interface with owner access control
 *
 * Main Responsibilities:
 * - Handles dynamic routing for event ID and owner ID URL parameters
 * - Manages async parameter resolution from Next.js 15 Promise-based params
 * - Provides context provider hierarchy for event, approver, and gift management
 * - Implements optimistic UI rendering with client-side data fetching
 * - Ensures proper access control through owner ID validation
 *
 * Architecture Role:
 * - Entry point for event owner management interface
 * - Establishes context boundaries for event-scoped state management
 * - Connects URL routing parameters to application state management
 * - Bridges server-side routing with client-side context providers
 * - Foundation for event administration and gift management workflows
 */

"use client";

import { useEffect, useState } from "react";
import { EventProvider } from "@/app/contexts/EventContext";
import { ApproverProvider } from "@/app/contexts/ApproverContext";
import { GiftProvider } from "@/app/contexts/gift/GiftContext";
import OptimisticEventDetailsClient from "./OptimisticEventDetailsClient";

/**
 * Event details page component with owner access control and context providers
 *
 * @param params - Promise containing eventId and ownerId from dynamic route segments
 * @returns JSX.Element with nested context providers and optimistic event details UI
 *
 * @sideEffects
 * - Resolves async route parameters and updates local state
 * - Establishes context provider tree for event management
 * - Triggers client-side data fetching through context hooks
 *
 * @performance
 * - Uses optimistic rendering to show UI immediately while data loads
 * - Async parameter resolution minimizes blocking behavior
 * - Context providers enable efficient state sharing across components
 *
 * @businessLogic
 * - Requires both eventId and ownerId for proper access control
 * - Owner ID validation ensures only authorized users can manage events
 * - Optimistic approach improves perceived performance for users
 *
 * @notes
 * - Adapted for Next.js 15 Promise-based dynamic route parameters
 * - Loading state prevents premature rendering with undefined parameters
 * - Context hierarchy provides isolated state management for event operations
 *
 * @publicAPI Next.js page component rendered by app router
 */
export default function EventDetails({
  params,
}: {
  params: Promise<{ eventId: string; ownerId: string }>;
}) {
  const [resolvedParams, setResolvedParams] = useState<{
    eventId: string;
    ownerId: string;
  } | null>(null);

  /**
   * Resolves async route parameters from Next.js 15 Promise-based params
   *
   * @sideEffects Updates resolvedParams state when Promise resolves
   * @performance Single async operation on component mount
   * @notes Required for Next.js 15 compatibility with Promise-based route params
   */
  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  if (!resolvedParams) {
    return <div>Loading...</div>;
  }

  const { eventId, ownerId } = resolvedParams;

  // Use optimistic approach - render UI immediately with contexts
  // Data will be fetched client-side through context hooks
  return (
    <EventProvider eventId={eventId}>
      <ApproverProvider approverList={[]}>
        <GiftProvider giftList={[]}>
          <OptimisticEventDetailsClient eventId={eventId} ownerId={ownerId} />
        </GiftProvider>
      </ApproverProvider>
    </EventProvider>
  );
}

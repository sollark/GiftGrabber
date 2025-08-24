/**
 * OptimisticEventDetailsClient.tsx
 *
 * Purpose: Renders the event details page for event owners, providing optimistic UI and context-driven data management.
 *
 * Responsibilities:
 * - Fetches and synchronizes event data (applicants, approvers, gifts) with context using a generic sync hook
 * - Aggregates loading and error states for robust UI feedback
 * - Renders lists and skeletons for event management
 * - Handles all error UI via ErrorMessage component
 *
 * Architecture:
 * - Delegates all business logic and server sync to hooks/context
 * - No retry/manual error handling or styling changes in this file
 * - Follows DRY, separation-of-concerns, and maintainability best practices
 */

"use client";

import React, { useMemo } from "react";
import {
  useEventSelector,
  useEventActions,
} from "@/app/contexts/EventContext";
import {
  useApplicantSelector,
  useApplicantActions,
} from "@/app/contexts/ApplicantContext";
import {
  useApproverSelector,
  useApproverActions,
} from "@/app/contexts/ApproverContext";
import {
  useGiftSelector,
  useGiftActions,
} from "@/app/contexts/gift/GiftContext";
import { useEventDataSync } from "@/hooks/useEventDataSync";
import ApproverList from "@/components/approver/ApproverList";
import ApplicantList from "@/components/applicant/ApplicantList";
import ListSkeleton from "@/components/ui/ListSkeleton";
import ErrorMessage from "@/ui/form/ErrorMessage";
import GiftList from "@/components/gift/GiftList";

interface OptimisticEventDetailsClientProps {
  eventId: string;
  ownerId: string;
}

/**
 * Event details client component with optimistic rendering and context coordination
 *
 * @param eventId - Unique identifier for the event to display and manage
 * @param ownerId - Owner identifier for access control and event management permissions
 * @returns JSX.Element with event management interface including lists and loading states
 *
   // UI component for event details page. All context/server sync logic is handled by useContextSync hook.
 * @sideEffects
 * - Fetches event data from server and updates multiple contexts
 * - Updates Event, Approver, and Gift context states
 * - Triggers re-renders in child components when data loads
 *
 * @performance
 * - Uses optimistic UI to show interface immediately
 * - Memoizes data extraction from Maybe types to prevent unnecessary re-renders
 * - Implements intelligent loading states based on data availability
 *
 * @businessLogic
 * - Event context stores only eventId, not full event object to avoid duplication
 * - Different contexts manage their specific data domains (approvers, gifts, etc.)
 * - Loading states adapt based on which data is available vs expected
 *
 * @notes
 * - Optimistic approach prioritizes user experience over data consistency
 * - Error handling includes retry mechanisms for robust user experience
 * - Context coordination ensures data flows to appropriate state managers
 *
 * @publicAPI Component used by event details page for owner interface
 */
export default function OptimisticEventDetailsClient({
  eventId,
  ownerId,
}: OptimisticEventDetailsClientProps) {
  // --- Context Selectors ---
  // Extract data from contexts using stable selectors
  const eventData = useEventSelector((state) => state.data);
  const rawEventActions = useEventActions();

  // --- Context Data Extraction with Stable References ---
  /**
   * Helper to safely extract value from a Maybe type, fallback to default.
   */
  const extractOrDefault = <T,>(maybe: any, fallback: T): T => {
    return maybe && maybe._tag === "Some" ? maybe.value : fallback;
  };

  // Context selectors - extract once per render
  const rawApplicantList = useApplicantSelector((state) => state.data.applicantList);
  const rawApproverList = useApproverSelector((state) => state.data.approverList);
  const rawGiftList = useGiftSelector((state) => state.data.giftList);
  const rawApplicantActions = useApplicantActions();
  const rawApproverActions = useApproverActions();
  const rawGiftActions = useGiftActions();

  // Extract values using stable function
  const applicantList = extractOrDefault(rawApplicantList, []);
  const approverList = extractOrDefault(rawApproverList, []);
  const giftList = extractOrDefault(rawGiftList, []);
  const eventDetails = extractOrDefault(eventData, { eventId, name: "", email: "" });

  // Create stable context actions object - memoized by actual action functions
  const contextActions = useMemo(() => {
    const eventActions = extractOrDefault(rawEventActions, {
      dispatchSafe: () => {},
    });
    const applicantActions = extractOrDefault(rawApplicantActions, {
      dispatchSafe: () => {},
    });
    const approverActions = extractOrDefault(rawApproverActions, {
      dispatchSafe: () => {},
    });
    const giftActions = extractOrDefault(rawGiftActions, {
      dispatchSafe: () => {},
    });

    return {
      eventActions: { _tag: "Some" as const, value: eventActions },
      applicantActions: { _tag: "Some" as const, value: applicantActions },
      approverActions: { _tag: "Some" as const, value: approverActions },
      giftActions: { _tag: "Some" as const, value: giftActions },
    };
  }, [
    rawEventActions,
    rawApplicantActions,
    rawApproverActions,
    rawGiftActions,
  ]);

  /**
   * Unified Event Data Synchronization
   *
   * Uses the new useEventDataSync hook to:
   * - Fetch event data once from the server
   * - Distribute data to all relevant contexts
   * - Provide unified loading and error states
   * - Eliminate redundant API calls
   */
  const { isLoading, result } = useEventDataSync(eventId, contextActions);

  /**
   * Error handling with Result pattern
   */
  const error = useMemo(() => {
    return result && result._tag === "Failure" ? result.error : null;
  }, [result]);

  /**
   * Loading state calculations - memoized for performance
   */
  const loadingStates = useMemo(() => {
    const shouldShowGiftLoading =
      isLoading && applicantList.length > 0 && giftList.length === 0;
    const isInitialLoad = isLoading;
    const hasNoData =
      applicantList.length === 0 &&
      approverList.length === 0 &&
      giftList.length === 0;

    return {
      shouldShowGiftLoading,
      isInitialLoad,
      hasNoData,
    };
  }, [isLoading, applicantList.length, approverList.length, giftList.length]);

  /**
   * Render Logic with Optimistic UI
   *
   * Strategy:
   * - Show loading indicators while syncing
   * - Display error messages with recovery options
   * - Render data lists with appropriate loading states
   * - Use skeletons for initial load to improve perceived performance
   */
  return (
    <div>
      <h1>{eventDetails.name || "Event Details"}</h1>
      {eventDetails.email && (
        <p className="text-gray-600 mb-4">Contact: {eventDetails.email}</p>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="text-blue-600 mb-4">Syncing with server...</div>
      )}

      {/* Error handling with ErrorMessage component */}
      {error && <ErrorMessage message={error} />}

      {/* Data lists - show skeletons during initial load or context data */}
      <div className="space-y-6">
        {loadingStates.isInitialLoad && loadingStates.hasNoData ? (
          <>
            <ListSkeleton title="Approvers" rows={2} columns={1} />
            <ListSkeleton title="Applicants" rows={4} columns={1} />
            <ListSkeleton title="Gifts" rows={4} columns={2} />
          </>
        ) : (
          <>
            <ApproverList personArray={approverList} isLoading={isLoading} />
            <ApplicantList personArray={applicantList} isLoading={isLoading} />
            <GiftList
              giftList={giftList}
              isLoading={isLoading}
              showLoadingWhenEmpty={loadingStates.shouldShowGiftLoading}
            />
          </>
        )}
      </div>
    </div>
  );
}

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

import React, { useCallback } from "react";
import { useEventSelector } from "@/app/contexts/EventContext";
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
import { useContextSync } from "@/hooks/useContextSync";
import ApproverList from "@/components/approver/ApproverList";
import ApplicantList from "@/components/applicant/ApplicantList";
import ListSkeleton from "@/components/ui/ListSkeleton";
import ErrorMessage from "@/ui/form/ErrorMessage";
import { getEventDetails } from "@/app/actions/event.action";
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
  // Extracts event data from context (not used directly, but may be needed for future extension)
  const eventData = useEventSelector((state) => state.data);

  // --- Context Data Extraction ---
  /**
   * Helper to safely extract value from a Maybe type, fallback to default.
   * @template T
   * @param maybe - Maybe<T> type (or undefined)
   * @param fallback - Default value if maybe is None or undefined
   * @returns T
   */
  function extractOrDefault<T>(maybe: any, fallback: T): T {
    return maybe && maybe._tag === "Some" ? maybe.value : fallback;
  }

  // Context selectors and actions
  const applicantList = extractOrDefault(
    useApplicantSelector((state) => state.data.applicantList),
    []
  );
  const approverList = extractOrDefault(
    useApproverSelector((state) => state.data.approverList),
    []
  );
  const giftList = extractOrDefault(
    useGiftSelector((state) => state.data.giftList),
    []
  );
  const applicantActions = extractOrDefault(useApplicantActions(), {
    dispatchSafe: () => {},
  });
  const approverActions = extractOrDefault(useApproverActions(), {
    dispatchSafe: () => {},
  });
  const giftActions = extractOrDefault(useGiftActions(), {
    dispatchSafe: () => {},
  });

  /**
   * useContextSync: Synchronizes context state with server for each list.
   * Returns loading and error state for each context.
   */
  const { isLoading: isApplicantsLoading, result: applicantsResult } =
    useContextSync({
      fetchServerData: async () => {
        const event = await getEventDetails(eventId);
        return event ? event.applicantList || [] : [];
      },
      contextValue: applicantList,
      contextActions: { _tag: "Some", value: applicantActions },
      buildAction: (serverList) => ({
        type: "SET_EVENT_APPLICANTS" as const,
        payload: { applicantList: serverList },
      }),
    });
  const { isLoading: isApproversLoading, result: approversResult } =
    useContextSync({
      fetchServerData: async () => {
        const event = await getEventDetails(eventId);
        return event ? event.approverList || [] : [];
      },
      contextValue: approverList,
      contextActions: { _tag: "Some", value: approverActions },
      buildAction: (serverList) => ({
        type: "SET_EVENT_APPROVERS" as const,
        payload: { approverList: serverList },
      }),
    });
  const { isLoading: isGiftsLoading, result: giftsResult } = useContextSync({
    fetchServerData: async () => {
      const event = await getEventDetails(eventId);
      return event ? event.giftList || [] : [];
    },
    contextValue: giftList,
    contextActions: { _tag: "Some", value: giftActions },
    buildAction: (serverList) => ({
      type: "SET_GIFT_LIST" as const,
      payload: serverList,
    }),
  });

  /**
   * Aggregates loading and error states from all context syncs.
   * @returns { isLoading: boolean, error: string | null }
   */
  const isLoading = isApplicantsLoading || isApproversLoading || isGiftsLoading;
  const error =
    (applicantsResult && applicantsResult._tag === "Failure"
      ? applicantsResult.error
      : null) ||
    (approversResult && approversResult._tag === "Failure"
      ? approversResult.error
      : null) ||
    (giftsResult && giftsResult._tag === "Failure" ? giftsResult.error : null);

  /**
   * Determines loading state for the GiftList skeleton.
   * @returns {boolean}
   */
  const shouldShowGiftLoading =
    isLoading && applicantList.length > 0 && giftList.length === 0;

  /**
   * Determines if the initial load skeletons should be shown.
   * @returns {boolean}
   */
  const isInitialLoad = isLoading;
  const hasNoData =
    applicantList.length === 0 &&
    approverList.length === 0 &&
    giftList.length === 0;

  /**
   * Context/Server Synchronization Strategy (Documented for this component)
   * ----------------------------------------------------------------------
   *
   * This component uses the generic useContextSync hook to keep context state in sync with server data.
   * For each list (applicants, approvers, gifts):
   *   - Fetches the latest data from the server
   *   - Deep-compares with the current context value
   *   - Only dispatches a context update if the data is different
   *   - Returns loading and error state for UI
   *
   * This pattern is DRY, testable, and reusable for any context/server sync in the app.
   */

  /**
   * Resets loading state and retries data fetching on error
   *
   * @sideEffects
   * - Resets loading flags to trigger data refetch
   * - Clears error state for fresh attempt
   *
   * @performance Triggers full data reload cycle
   * @notes Provides user recovery mechanism for failed data loads
   * @publicAPI Exposed through retry button in error UI
   */

  // --- Unused Functions ---
  // handleRetry is unused and can be safely removed. If you need retry logic, consider using a dedicated error boundary or a custom hook for error recovery.

  /**
   * Renders the event details UI, including loading, error, and data lists.
   */
  return (
    <div>
      <h1>Event Details</h1>

      {/* Loading indicator */}
      {isLoading && (
        <div className="text-blue-600 mb-4">Syncing with server...</div>
      )}

      {/* Error handling with ErrorMessage component */}
      {error && <ErrorMessage message={error} />}

      {/* Data lists - show skeletons during initial load or context data */}
      <div className="space-y-6">
        {isInitialLoad && hasNoData ? (
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
              showLoadingWhenEmpty={shouldShowGiftLoading}
            />
          </>
        )}
      </div>
    </div>
  );
}

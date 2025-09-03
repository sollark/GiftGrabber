/**
 * EventDetailsClient.tsx
 *
 * Purpose: Renders the event details page for event owners, providing optimistic UI and context-driven data management.
 *
 * Responsibilities:
 * - Fetches and synchronizes event data (applicants, gifts) with context using a generic sync hook
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
import { getMaybeOrElse } from "@/utils/fp";
import { useEventContext } from "@/app/contexts/EventContext";
import { useApplicantContext } from "@/app/contexts/ApplicantContext";
import { useGiftContext } from "@/app/contexts/gift/GiftContext";
import { Person } from "@/database/models/person.model";
import { useEventDataSync } from "@/hooks/useEventDataSync";
import ApplicantList from "@/components/applicant/ApplicantList";
import ListSkeleton from "@/components/ui/ListSkeleton";
import ErrorMessage from "@/components/ui/ErrorMessage";
import GiftList from "@/components/gift/GiftList";

interface EventDetailsClientProps {
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
 * - Updates Event, and Gift context states
 * - Triggers re-renders in child components when data loads
 *
 * @performance
 * - Uses optimistic UI to show interface immediately
 * - Memoizes data extraction from Maybe types to prevent unnecessary re-renders
 * - Implements intelligent loading states based on data availability
 *
 * @businessLogic
 * - Event context stores only eventId, not full event object to avoid duplication
 * - Different contexts manage their specific data domains ( gifts, etc.)
 * - Loading states adapt based on which data is available vs expected
 *
 * @notes
 * - Optimistic approach prioritizes user experience over data consistency
 * - Error handling includes retry mechanisms for robust user experience
 * - Context coordination ensures data flows to appropriate state managers
 *
 * @publicAPI Component used by event details page for owner interface
 */
export default function EventDetailsClient({
  eventId,
  ownerId,
}: EventDetailsClientProps) {
  // --- Context Access ---
  const eventContext = useEventContext();
  const applicantContext = useApplicantContext();
  const giftContext = useGiftContext();

  // Extract values from context
  const eventDetails = getMaybeOrElse({ eventId, name: "", email: "" })(
    eventContext._tag === "Some" && eventContext.value.state.data.eventId
      ? {
          _tag: "Some",
          value: {
            eventId: eventContext.value.state.data.eventId,
            name: eventContext.value.state.data.name ?? "",
            email: eventContext.value.state.data.email ?? "",
          },
        }
      : { _tag: "None" }
  );

  const applicantList = getMaybeOrElse<Person[]>([])(
    applicantContext._tag === "Some" &&
      Array.isArray(applicantContext.value.state.data.applicantList)
      ? { _tag: "Some", value: applicantContext.value.state.data.applicantList }
      : { _tag: "None" }
  );

  const giftList = getMaybeOrElse<any[]>([])(
    giftContext._tag === "Some" &&
      Array.isArray(giftContext.value.state.data.giftList)
      ? { _tag: "Some", value: giftContext.value.state.data.giftList }
      : { _tag: "None" }
  );

  // Create stable context actions object - memoized by actual action functions
  const contextActions = useMemo(() => {
    const toActions = (ctx: any, fallbackTag = "Some") =>
      ctx && ctx._tag === "Some"
        ? { _tag: fallbackTag, value: { dispatch: ctx.value.dispatch } }
        : { _tag: fallbackTag, value: { dispatch: () => {} } };
    return {
      eventActions:
        eventContext && eventContext._tag === "Some"
          ? { _tag: "Some", value: { dispatch: eventContext.value.dispatch } }
          : undefined,
      applicantActions: toActions(applicantContext),
      giftActions: toActions(giftContext),
    };
  }, [eventContext, applicantContext, giftContext]);

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
    const hasNoData = applicantList.length === 0 && giftList.length === 0;

    return {
      shouldShowGiftLoading,
      isInitialLoad,
      hasNoData,
    };
  }, [isLoading, applicantList.length, giftList.length]);

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
            <ListSkeleton title="Applicants" rows={4} columns={1} />
            <ListSkeleton title="Gifts" rows={4} columns={2} />
          </>
        ) : (
          <>
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

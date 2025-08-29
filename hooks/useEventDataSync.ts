import { useCallback, useEffect, useState, useRef } from "react";
import { getEvent, getEventDetails } from "@/app/actions/event.action";
import { Result, success, failure } from "@/utils/fp";

/**
 * useEventDataSync
 *
 * Custom hook to fetch event details once and distribute to multiple contexts.
 * Uses ref-based stability to prevent duplicate dispatches.
 *
 * @param eventId - The event ID to fetch data for
 * @param contextActions - Object containing all context action dispatchers
 * @returns Object with loading state, result, and refetch function
 */
export function useEventDataSync(
  eventId: string,
  contextActions: {
    eventActions?: {
      _tag: string;
      value: { dispatchSafe: (action: any) => void };
    };
    applicantActions: {
      _tag: string;
      value: { dispatchSafe: (action: any) => void };
    };
    approverActions: {
      _tag: string;
      value: { dispatchSafe: (action: any) => void };
    };
    giftActions: {
      _tag: string;
      value: { dispatchSafe: (action: any) => void };
    };
  }
) {
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<Result<true, string> | null>(null);
  const hasInitialLoadRef = useRef(false);
  const lastSyncedEventRef = useRef<string | null>(null);

  // Store context actions in refs for stable references
  const contextActionsRef = useRef(contextActions);
  contextActionsRef.current = contextActions;

  const syncEventData = useCallback(async () => {
    // Prevent duplicate syncs for the same event
    if (lastSyncedEventRef.current === eventId && hasInitialLoadRef.current) {
      return;
    }

    console.log(`🔄 useEventDataSync: Starting sync for eventId: ${eventId}`);
    setResult(null);
    setIsLoading(true);

    try {
      const event = await getEvent(eventId);
      console.log("📦 Event data received:", event);

      if (event) {
        const actions = contextActionsRef.current;

        // Dispatch event details to Event Context if available
        if (actions.eventActions && actions.eventActions._tag === "Some") {
          console.log(
            "📤 Dispatching event details to event context:",
            event.name,
            event.email
          );
          actions.eventActions.value.dispatchSafe({
            type: "SET_EVENT_DETAILS" as const,
            payload: { name: event.name, email: event.email, eventId },
          });
        }

        // Dispatch to applicant context
        if (actions.applicantActions._tag === "Some") {
          console.log(
            "📤 Dispatching to applicant context:",
            event.applicantList?.length || 0,
            "items"
          );
          actions.applicantActions.value.dispatchSafe({
            type: "SET_EVENT_APPLICANTS" as const,
            payload: { applicantList: event.applicantList || [] },
          });
        }

        // Dispatch to approver context
        if (actions.approverActions._tag === "Some") {
          console.log(
            "📤 Dispatching to approver context:",
            event.approverList?.length || 0,
            "items"
          );
          actions.approverActions.value.dispatchSafe({
            type: "SET_EVENT_APPROVERS" as const,
            payload: { approverList: event.approverList || [] },
          });
        }

        // Dispatch to gift context
        if (actions.giftActions._tag === "Some") {
          console.log(
            "📤 Dispatching to gift context:",
            event.giftList?.length || 0,
            "items"
          );
          actions.giftActions.value.dispatchSafe({
            type: "SET_GIFT_LIST" as const,
            payload: event.giftList || [],
          });
        }
      }

      lastSyncedEventRef.current = eventId;
      setResult(success(true));
      console.log("✅ useEventDataSync: Sync completed successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch event data";
      setResult(failure(errorMessage));
      console.error("❌ useEventDataSync: Sync failed:", errorMessage);
    } finally {
      setIsLoading(false);
      hasInitialLoadRef.current = true;
    }
  }, [eventId]);

  // Initial load effect - only runs once per eventId
  useEffect(() => {
    if (!hasInitialLoadRef.current || lastSyncedEventRef.current !== eventId) {
      syncEventData();
    }
  }, [syncEventData]);

  return {
    isLoading,
    result,
    refetch: syncEventData,
    hasData: hasInitialLoadRef.current,
  };
}

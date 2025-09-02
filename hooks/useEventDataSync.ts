import { useCallback, useEffect, useState, useRef } from "react";
import { getEvent } from "@/app/actions/event.action";
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
      value: { dispatch: (action: any) => void };
    };
    applicantActions: {
      _tag: string;
      value: { dispatch: (action: any) => void };
    };
    giftActions: {
      _tag: string;
      value: { dispatch: (action: any) => void };
    };
  }
) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [result, setResult] = useState<Result<true, string>>(success(true));
  const hasInitialLoadRef = useRef<boolean>(false);
  const lastSyncedEventRef = useRef<string | null>(null);

  // Store context actions in refs for stable references
  const contextActionsRef = useRef(contextActions);
  contextActionsRef.current = contextActions;

  /**
   * Synchronizes event data and dispatches to contexts. Returns a Result type for error handling.
   */
  const syncEventData = useCallback(async (): Promise<Result<true, string>> => {
    // Prevent duplicate syncs for the same event
    if (lastSyncedEventRef.current === eventId && hasInitialLoadRef.current) {
      return success(true);
    }

    setResult(success(true));
    setIsLoading(true);

    try {
      const event = await getEvent(eventId);
      if (event) {
        const actions = contextActionsRef.current;

        // Dispatch event details to Event Context if available
        if (actions.eventActions && actions.eventActions._tag === "Some") {
          actions.eventActions.value.dispatch({
            type: "SET_EVENT_DETAILS" as const,
            payload: { name: event.name, email: event.email, eventId },
          });
        }

        // Dispatch to applicant context
        if (actions.applicantActions._tag === "Some") {
          actions.applicantActions.value.dispatch({
            type: "SET_EVENT_APPLICANTS" as const,
            payload: { applicantList: event.applicantList || [] },
          });
        }
        // Dispatch to gift context
        if (actions.giftActions._tag === "Some") {
          actions.giftActions.value.dispatch({
            type: "SET_GIFT_LIST" as const,
            payload: event.giftList || [],
          });
        }
      }

      lastSyncedEventRef.current = eventId;
      setResult(success(true));
      hasInitialLoadRef.current = true;
      setIsLoading(false);
      return success(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch event data";
      setResult(failure(errorMessage));
      setIsLoading(false);
      hasInitialLoadRef.current = true;
      return failure(errorMessage);
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

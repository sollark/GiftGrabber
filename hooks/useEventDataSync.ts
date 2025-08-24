import { useCallback, useEffect, useState, useMemo } from "react";
import { getEventDetails } from "@/app/actions/event.action";
import { Result, success, failure } from "@/utils/fp";

/**
 * useEventDataSync
 *
 * Custom hook to fetch event details once and distribute to multiple contexts.
 * This prevents redundant API calls while maintaining individual context loading states.
 *
 * Best Practices:
 * - Single source of truth for event data fetching
 * - Proper error handling with Result types
 * - Memoized context actions to prevent unnecessary re-renders
 * - Clear separation of concerns between data fetching and context updates
 *
 * @param eventId - The event ID to fetch data for
 * @param contextActions - Object containing all context action dispatchers
 * @returns Object with loading state, result, and refetch function
 */
export function useEventDataSync(
  eventId: string,
  contextActions: {
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
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  // Memoize context actions to ensure stable references
  const stableContextActions = useMemo(
    () => ({
      applicant: contextActions.applicantActions,
      approver: contextActions.approverActions,
      gift: contextActions.giftActions,
    }),
    [
      contextActions.applicantActions._tag,
      contextActions.applicantActions.value.dispatchSafe,
      contextActions.approverActions._tag,
      contextActions.approverActions.value.dispatchSafe,
      contextActions.giftActions._tag,
      contextActions.giftActions.value.dispatchSafe,
    ]
  );

  const syncEventData = useCallback(async () => {
    setResult(null);
    setIsLoading(true);

    try {
      const event = await getEventDetails(eventId);

      if (event) {
        // Dispatch to all contexts simultaneously with proper error boundaries
        try {
          if (stableContextActions.applicant._tag === "Some") {
            stableContextActions.applicant.value.dispatchSafe({
              type: "SET_EVENT_APPLICANTS" as const,
              payload: { applicantList: event.applicantList || [] },
            });
          }
        } catch (err) {
          console.warn("Failed to update applicant context:", err);
        }

        try {
          if (stableContextActions.approver._tag === "Some") {
            stableContextActions.approver.value.dispatchSafe({
              type: "SET_EVENT_APPROVERS" as const,
              payload: { approverList: event.approverList || [] },
            });
          }
        } catch (err) {
          console.warn("Failed to update approver context:", err);
        }

        try {
          if (stableContextActions.gift._tag === "Some") {
            stableContextActions.gift.value.dispatchSafe({
              type: "SET_GIFT_LIST" as const,
              payload: event.giftList || [],
            });
          }
        } catch (err) {
          console.warn("Failed to update gift context:", err);
        }
      }

      setResult(success(true));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch event data";
      setResult(failure(errorMessage));
    } finally {
      setIsLoading(false);
      setHasInitialLoad(true);
    }
  }, [eventId, stableContextActions]);

  // Initial load effect
  useEffect(() => {
    if (!hasInitialLoad) {
      syncEventData();
    }
  }, [syncEventData, hasInitialLoad]);

  return {
    isLoading,
    result,
    refetch: syncEventData,
    hasData: hasInitialLoad,
  };
}

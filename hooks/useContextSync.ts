import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { deepEqual } from "@/utils/utils";
import { Result, success, failure } from "@/utils/fp";

/**
 * useContextSync
 * Generic hook to synchronize context state with server data using deep comparison.
 * Optimized to prevent infinite re-renders through proper memoization.
 *
 * @template T - The type of the data being synchronized
 * @param fetchServerData - Async function to fetch the latest server data
 * @param contextValue - The current value from context
 * @param contextActions - The context action dispatcher (must have ._tag and .value.dispatchSafe)
 * @param buildAction - Function to build the action object for dispatchSafe
 * @returns { isLoading: boolean, result: Result<true, string> | null }
 *
 * Usage:
 *   const fetchServerData = useCallback(() => getEventDetails(eventId), [eventId]);
 *   const buildAction = useCallback((serverData) => ({
 *     type: "SET_EVENT_APPLICANTS",
 *     payload: { applicantList: serverData.applicantList || [] }
 *   }), []);
 *
 *   useContextSync({
 *     fetchServerData,
 *     contextValue: applicantList,
 *     contextActions: applicantActions,
 *     buildAction
 *   });
 */

export function useContextSync<T, A = any>({
  fetchServerData,
  contextValue,
  contextActions,
  buildAction,
}: {
  fetchServerData: () => Promise<T>;
  contextValue: any;
  contextActions: {
    _tag: string;
    value: { dispatchSafe: (action: A) => void };
  };
  buildAction: (serverData: T) => A;
}): { isLoading: boolean; result: Result<true, string> | null } {
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<Result<true, string> | null>(null);

  // Track if we've completed the initial load
  const initialLoadCompleteRef = useRef(false);

  // Store the last synced value to prevent unnecessary updates
  const lastSyncedValueRef = useRef<T | null>(null);

  // Memoize the context actions reference for stable dependency
  const stableContextActions = useMemo(
    () => contextActions,
    [contextActions._tag, contextActions.value.dispatchSafe]
  );

  const sync = useCallback(async () => {
    if (stableContextActions._tag !== "Some") {
      return;
    }

    setResult(null);
    try {
      const serverData = await fetchServerData();

      // Only dispatch if the data has actually changed from our last sync
      if (!deepEqual(serverData, lastSyncedValueRef.current)) {
        lastSyncedValueRef.current = serverData;
        stableContextActions.value.dispatchSafe(buildAction(serverData));
      }

      setResult(success(true));
    } catch (err) {
      setResult(
        failure(err instanceof Error ? err.message : "Failed to sync context")
      );
    } finally {
      setIsLoading(false);
      initialLoadCompleteRef.current = true;
    }
  }, [fetchServerData, stableContextActions, buildAction]);

  useEffect(() => {
    if (!initialLoadCompleteRef.current) {
      sync();
    }
  }, [sync]);

  return { isLoading, result };
}

import { useEffect, useState } from "react";
import { deepEqual } from "@/utils/utils";
import { Result, success, failure } from "@/utils/fp";

/**
 * useContextSync
 * Generic hook to synchronize context state with server data using deep comparison.
 *
 * @template T - The type of the data being synchronized
 * @param fetchServerData - Async function to fetch the latest server data
 * @param contextValue - The current value from context
 * @param contextActions - The context action dispatcher (must have ._tag and .value.dispatchSafe)
 * @param buildAction - Function to build the action object for dispatchSafe
 * @returns { isLoading: boolean, result: Result<true, string> | null }
 *
 * Usage:
 *   useContextSync({
 *     fetchServerData: () => getEventDetails(eventId),
 *     contextValue: applicantList,
 *     contextActions: applicantActions,
 *     buildAction: (serverData) => ({ type: "SET_EVENT_APPLICANTS", payload: { applicantList: serverData.applicantList || [] } })
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
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [result, setResult] = useState<Result<true, string> | null>(null);

  useEffect(() => {
    const sync = async () => {
      setResult(null);
      try {
        const serverData = await fetchServerData();
        if (
          contextActions._tag === "Some" &&
          !deepEqual(serverData, contextValue)
        ) {
          contextActions.value.dispatchSafe(buildAction(serverData));
        }
        setResult(success(true));
      } catch (err) {
        setResult(
          failure(err instanceof Error ? err.message : "Failed to sync context")
        );
      } finally {
        setIsLoading(false);
        setInitialLoadComplete(true);
      }
    };
    if (!initialLoadComplete) {
      sync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    fetchServerData,
    contextValue,
    contextActions,
    buildAction,
    initialLoadComplete,
  ]);

  return { isLoading, result };
}

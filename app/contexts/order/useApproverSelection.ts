import { Person } from "@/database/models/person.model";
import { useOrderActions, useOrderSelector } from "./OrderContext";
import { failure } from "@/lib/fp-utils";

/**
 * Hook for approver selection
 * Provides selection, clearing, and retrieval of approver.
 */
export const useApproverSelection = () => {
  const actions = useOrderActions();
  const selectedApprover = useOrderSelector(
    (state: any) => state.selectedApprover
  );
  const approverList = useOrderSelector((state: any) => state.approverList);

  const selectApprover = (approver: Person) => {
    if (actions._tag === "Some") {
      return actions.value.dispatchSafe({
        type: "SELECT_APPROVER",
        payload: approver,
      });
    }
    return failure(new Error("Order context not available"));
  };

  const clearApprover = () => {
    if (actions._tag === "Some") {
      return actions.value.dispatchSafe({
        type: "CLEAR_APPROVER",
      });
    }
    return failure(new Error("Order context not available"));
  };

  const getApprover = () => {
    return selectedApprover._tag === "Some" ? selectedApprover.value : null;
  };

  return {
    selectedApprover,
    approverList,
    selectApprover,
    clearApprover,
    getApprover,
    hasSelection: selectedApprover._tag === "Some",
  };
};

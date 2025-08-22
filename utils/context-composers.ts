/**
 * @file context-composers.ts
 *
 * Purpose: Provides composable context utilities for common combinations of contexts
 * used throughout the application. Builds upon the existing useMultipleContexts pattern.
 *
 * Main Responsibilities:
 * - Composes frequently used context combinations into single hooks
 * - Reduces coupling between components and multiple context providers
 * - Maintains type safety through existing functional patterns
 *
 * Architectural Role:
 * - Bridge between individual contexts and components
 * - Leverages existing fp-contexts utilities for composition
 */

import { Maybe } from "@/utils/fp";
import { useMultipleContexts } from "@/utils/fp-contexts";
import { useEventActions } from "@/app/contexts/EventContext";
import { useApplicantActions } from "@/app/contexts/ApplicantContext";
import { useApproverActions } from "@/app/contexts/ApproverContext";

/**
 * useEventFormContexts (Public API)
 *
 * Composed hook for accessing all event-related context actions safely.
 * Leverages existing useMultipleContexts utility for type-safe composition.
 *
 * @returns Maybe<object> - All context actions or none if any are missing
 * @sideEffects None
 * @notes Used in CreateEventForm and similar components requiring multiple contexts
 */
export const useEventFormContexts = () => {
  return useMultipleContexts({
    event: useEventActions,
    applicant: useApplicantActions,
    approver: useApproverActions,
  });
};

/**
 * useEventDisplayContexts (Public API)
 *
 * Composed hook for event display contexts (read-only operations).
 * Useful for components that need to read from multiple contexts without actions.
 *
 * @returns Maybe<object> - Context values for display purposes
 * @sideEffects None
 * @notes Future enhancement point for display-specific context composition
 */
export const useEventDisplayContexts = () => {
  // Placeholder for future display-specific context composition
  // Currently returns the same as form contexts for backward compatibility
  return useEventFormContexts();
};

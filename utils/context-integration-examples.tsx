/**
 * @file Context Integration Examples
 *
 * Purpose: Provides advanced integration patterns for combining multiple functional React contexts (Applicant, Gift, Order, Approver, Multistep) in a single provider tree.
 *
 * Main Responsibilities:
 * - Defines a combined provider for orchestrating context setup and data flow across the app's main business workflows (order creation, approval, etc.)
 * - Implements composite hooks that encapsulate multi-context business logic for order creation and approval.
 * - Provides example UI components and utilities for context composition and cross-context state synchronization.
 *
 * Architectural Role:
 * - Sits at the integration layer, bridging domain contexts and UI workflows.
 * - Encapsulates business process logic that spans multiple contexts.
 * - Promotes separation of concerns by keeping context setup and workflow logic out of UI components.
 */

import React from "react";
import { getMaybeOrElse, failure } from "@/utils/fp";

// Enhanced context imports
import {
  ApplicantProvider,
  useApplicantSelection,
} from "@/app/contexts/ApplicantContext";
import {
  GiftProvider,
  useGiftSelector,
  useGiftActions,
} from "@/app/contexts/gift/GiftContext";

import {
  OrderProvider,
  useOrderStatus,
  useApproverSelection,
  useOrderTracking,
} from "@/app/contexts/order/OrderContext";
import { useApproverSelector } from "@/app/contexts/ApproverContext";

import MultistepContextAPI from "@/app/contexts/multistep/MultistepContext";
const { BaseMultistepProvider, useStepNavigation, useStepData } =
  MultistepContextAPI;
import { StepDefinition } from "@/app/contexts/multistep/types";

// Model imports
import { Order } from "@/database/models/order.model";
import { Person } from "@/database/models/person.model";
import { Gift } from "@/database/models/gift.model";
import { Types } from "mongoose";
import { ExcelFormatType } from "@/types/excel.types";

// Helper function to get person name
const getPersonName = (person: Person): string => {
  return `${person.firstName} ${person.lastName}`;
};

// ============================================================================
// COMBINED CONTEXT PROVIDER
// ============================================================================

/**
 * Props for flexible context provider composition
 */
interface FlexibleProviderProps {
  children: React.ReactNode;
  contexts: {
    applicant?: { applicantList: Person[] };
    gift?: { giftList: Gift[] };
    order?: { order: Order; approverList: Person[] };
    multistep?: { steps: StepDefinition[] };
  };
}

/**
 * CombinedContextProvider (Public API) - Enhanced for flexibility
 *
 * Sets up only the required functional contexts based on provided configuration.
 * Enables selective context provisioning for better performance and decoupling.
 *
 * @param props FlexibleProviderProps
 * @returns React element wrapping children in required providers
 * @sideEffects Instantiates only specified context providers
 * @notes Avoids over-provisioning state for components that don't need all contexts
 */
export const CombinedContextProvider: React.FC<FlexibleProviderProps> = ({
  children,
  contexts,
}) => {
  let wrappedChildren = children;

  // Apply contexts conditionally based on configuration
  if (contexts.multistep) {
    wrappedChildren = (
      <BaseMultistepProvider steps={contexts.multistep.steps}>
        {wrappedChildren}
      </BaseMultistepProvider>
    );
  }

  if (contexts.order) {
    wrappedChildren = <OrderProvider>{wrappedChildren}</OrderProvider>;
  }

  if (contexts.gift) {
    wrappedChildren = (
      <GiftProvider giftList={contexts.gift.giftList}>
        {wrappedChildren}
      </GiftProvider>
    );
  }

  if (contexts.applicant) {
    wrappedChildren = (
      <ApplicantProvider applicantList={contexts.applicant.applicantList}>
        {wrappedChildren}
      </ApplicantProvider>
    );
  }

  return <>{wrappedChildren}</>;
};

// Backward compatibility - Legacy interface (deprecated)
interface LegacyCombinedProviderProps {
  children: React.ReactNode;
  order: Order;
  applicants: Person[];
  approverList: Person[];
  gifts: Gift[];
  multistepSteps: StepDefinition[];
}

/**
 * @deprecated Use CombinedContextProvider with contexts prop instead
 */
export const LegacyCombinedContextProvider: React.FC<
  LegacyCombinedProviderProps
> = ({ children, order, applicants, approverList, gifts, multistepSteps }) => {
  return (
    <CombinedContextProvider
      contexts={{
        applicant: {
          applicantList: applicants,
        },
        gift: { giftList: gifts },
        order: { order, approverList },
        multistep: { steps: multistepSteps },
      }}
    >
      {children}
    </CombinedContextProvider>
  );
};

// ============================================================================
// COMPOSITE HOOKS FOR COMPLEX OPERATIONS
// ============================================================================

/**
 * useOrderCreationWorkflow (Public API)
 *
 * Composite hook that orchestrates the order creation process across multiple contexts.
 * Encapsulates business logic for applicant selection, gift selection, and order submission.
 *
 * @returns Object containing state and action handlers for the order creation workflow
 * @sideEffects Triggers context state changes, notifications, and step navigation
 * @notes Handles validation and error notification for each step
 */
export const useOrderCreationWorkflow = () => {
  // Context hooks
  const { selectedApplicant, selectApplicant } = useApplicantSelection();
  const applicantGifts = getMaybeOrElse<Gift[]>([])(
    useGiftSelector((state) => state.data.applicantGifts)
  );
  const actions = useGiftActions();
  /**
   * addGift - Adds a gift using context actions. Returns Result.
   * @param gift - Gift object to add
   * @returns Result<void, Error>
   */
  /**
   * addGift (Internal Helper)
   * Adds a gift using context actions.
   * @param gift Gift - Gift object to add
   * @returns Result<void, Error> - Success or failure of the add operation
   * @sideEffects Dispatches context action, may update state
   */
  const addGift = React.useCallback(
    (gift: Gift) => {
      if (actions._tag === "Some") {
        return actions.value.dispatchSafe({ type: "ADD_GIFT", payload: gift });
      }
      return failure(new Error("Gift actions unavailable"));
    },
    [actions]
  );
  const { order, confirmOrder, rejectOrder } = useOrderStatus();
  const navigation = useStepNavigation();
  const currentStep = navigation.currentStep;

  /**
   * goToNextStep (Internal Helper)
   * Advances to the next step in the multistep workflow.
   * @returns Result of navigation.goToNextStep()
   * @sideEffects Updates navigation state
   */
  const goToNextStep = React.useCallback(() => {
    return navigation.goToNextStep();
  }, [navigation]);

  /**
   * goToPreviousStep (Internal Helper)
   * Moves to the previous step in the multistep workflow.
   * @returns Result of navigation.goToPreviousStep()
   * @sideEffects Updates navigation state
   */
  const goToPreviousStep = React.useCallback(() => {
    return navigation.goToPreviousStep();
  }, [navigation]);

  const canGoNext = navigation.canGoNext;
  const { setStepData, getCurrentStepData } = useStepData();
  const { addNotification } = useOrderTracking();

  /**
   * Proceeds to next step with basic data check
   */

  /**
   * proceedToNext (Internal Helper)
   * Proceeds to the next step, validating required data for the current step.
   * @returns Result<void, Error> - Success or failure of step transition
   * @sideEffects May trigger notifications and navigation state changes
   * @notes Enforces required step completion before advancing
   */
  const proceedToNext = React.useCallback(async () => {
    if (!currentStep) return failure(new Error("No current step"));

    // Basic data check - ensure current step has data if required
    const currentData = getCurrentStepData();
    if (!currentStep.isOptional && !currentData) {
      addNotification({
        type: "error",
        message: `Please complete ${currentStep.title}`,
      });
      return failure(new Error(`${currentStep.title} is required`));
    }

    // Proceed to next step
    return goToNextStep();
  }, [currentStep, getCurrentStepData, goToNextStep, addNotification]);

  /**
   * Completes applicant selection step
   */

  /**
   * completeApplicantSelection (Public API)
   * Completes the applicant selection step, updates context, and advances workflow.
   * @param applicant Person - The selected applicant
   * @returns Result<void, Error> - Success or failure of the operation
   * @sideEffects Updates context, triggers notifications, advances step
   */
  const completeApplicantSelection = React.useCallback(
    async (applicant: Person) => {
      // Select the applicant
      const selectResult = await selectApplicant(applicant);

      if (selectResult._tag === "Failure") {
        addNotification({
          type: "error",
          message: "Failed to select applicant",
        });
        return selectResult;
      }

      // Save step data
      await setStepData("applicant-selection", {
        selectedApplicant: applicant,
        completedAt: Date.now(),
      });

      addNotification({
        type: "success",
        message: `Applicant ${getPersonName(applicant)} selected`,
      });

      return proceedToNext();
    },
    [selectApplicant, setStepData, addNotification, proceedToNext]
  );
  /**
   * Completes gift selection step
   */

  /**
   * completeGiftSelection (Public API)
   * Completes the gift selection step, adds gifts, and advances workflow.
   * @param gifts Gift[] - Array of selected gifts
   * @returns Result<void, Error> - Success or failure of the operation
   * @sideEffects Updates context, triggers notifications, advances step
   * @notes Handles batch add and error aggregation
   */
  const completeGiftSelection = React.useCallback(
    async (gifts: Gift[]) => {
      // Add all gifts
      const addResults = await Promise.all(gifts.map((gift) => addGift(gift)));

      const hasErrors = addResults.some(
        (result: any) => result._tag === "Failure"
      );
      if (hasErrors) {
        addNotification({
          type: "error",
          message: "Failed to add some gifts",
        });
        return failure(new Error("Failed to add gifts"));
      }

      // Save step data
      await setStepData("gift-selection", {
        selectedGifts: gifts,
        completedAt: Date.now(),
      });

      addNotification({
        type: "success",
        message: `${gifts.length} gifts selected`,
      });

      return proceedToNext();
    },
    [addGift, setStepData, addNotification, proceedToNext]
  );

  /**
   * Submits the complete order
   */

  /**
   * submitOrder (Public API)
   * Submits the completed order for approval, validating all required data.
   * @param approver Person - The approver to submit to
   * @returns Result<void, Error> - Success or failure of the submission
   * @sideEffects Updates context, triggers notifications, saves step data
   * @notes Aggregates all workflow data for final submission
   */
  const submitOrder = React.useCallback(
    async (approver: Person) => {
      // Validate all required data
      if (
        selectedApplicant._tag !== "Some" ||
        selectedApplicant.value._tag !== "Some"
      ) {
        return failure(new Error("No applicant selected"));
      }

      if (applicantGifts.length === 0) {
        return failure(new Error("No gifts selected"));
      }

      // Confirm the order
      const confirmResult = await confirmOrder(approver);

      if (confirmResult._tag === "Success") {
        // Save final step data
        await setStepData("order-confirmation", {
          approver,
          submittedAt: Date.now(),
          orderDetails: {
            applicant: selectedApplicant.value.value,
            gifts: applicantGifts,
          },
        });

        addNotification({
          type: "success",
          message: "Order submitted successfully!",
        });
      }

      return confirmResult;
    },
    [
      selectedApplicant,
      applicantGifts,
      confirmOrder,
      setStepData,
      addNotification,
    ]
  );

  return {
    // State
    currentStep,
    selectedApplicant,
    applicantGifts,
    order,
    canGoNext,

    // Actions
    proceedToNext,
    completeApplicantSelection,
    completeGiftSelection,
    submitOrder,
    goToPreviousStep,
  };
};

/**
 * useOrderApprovalWorkflow (Public API)
 *
 * Composite hook that orchestrates the order approval process across multiple contexts.
 * Encapsulates business logic for order approval, rejection, and approver selection.
 *
 * @returns Object containing state and action handlers for the order approval workflow
 * @sideEffects Triggers context state changes, notifications, and history updates
 * @notes Handles validation and error notification for each approval action
 */
export const useOrderApprovalWorkflow = () => {
  const { order, confirmOrder, rejectOrder } = useOrderStatus();
  const { selectedApprover, selectApprover, approverList } =
    useApproverSelection();
  const { addHistoryEntry, addNotification } = useOrderTracking();

  /**
   * Approves an order with validation
   */

  /**
   * approveOrder (Public API)
   * Approves an order, updating context and history, and triggering notifications.
   * @param approver Person - The approver
   * @param notes string (optional) - Approval notes
   * @returns Result<void, Error> - Success or failure of the approval
   * @sideEffects Updates context, adds history entry, triggers notifications
   */
  const approveOrder = React.useCallback(
    async (approver: Person, notes?: string) => {
      // Select the approver first
      const selectResult = await selectApprover(approver);
      if (selectResult._tag === "Failure") {
        return selectResult;
      }

      // Add history entry
      await addHistoryEntry({
        action: "APPROVAL_INITIATED",
        actor: approver,
        details: `Approval process started by ${getPersonName(approver)}`,
        metadata: { notes },
      });

      // Confirm the order
      const confirmResult = await confirmOrder(approver);

      if (confirmResult._tag === "Success") {
        addNotification({
          type: "success",
          message: `Order approved by ${getPersonName(approver)}`,
        });
      } else {
        addNotification({
          type: "error",
          message: "Failed to approve order",
        });
      }

      return confirmResult;
    },
    [selectApprover, addHistoryEntry, confirmOrder, addNotification]
  );

  /**
   * Rejects an order with validation
   */

  /**
   * rejectOrderWithReason (Public API)
   * Rejects an order, updating context and history, and triggering notifications.
   * @param approver Person - The approver
   * @param reason string - Reason for rejection
   * @param notes string (optional) - Additional notes
   * @returns Result<void, Error> - Success or failure of the rejection
   * @sideEffects Updates context, adds history entry, triggers notifications
   */
  const rejectOrderWithReason = React.useCallback(
    async (approver: Person, reason: string, notes?: string) => {
      // Select the approver first
      const selectResult = await selectApprover(approver);
      if (selectResult._tag === "Failure") {
        return selectResult;
      }

      // Add history entry
      await addHistoryEntry({
        action: "REJECTION_INITIATED",
        actor: approver,
        details: `Rejection process started by ${getPersonName(approver)}`,
        metadata: { reason, notes },
      });

      // Reject the order
      const rejectResult = await rejectOrder(approver, reason);

      if (rejectResult._tag === "Success") {
        addNotification({
          type: "warning",
          message: `Order rejected by ${getPersonName(approver)}`,
        });
      } else {
        addNotification({
          type: "error",
          message: "Failed to reject order",
        });
      }

      return rejectResult;
    },
    [selectApprover, addHistoryEntry, rejectOrder, addNotification]
  );

  return {
    // State
    order,
    selectedApprover,
    approverList,

    // Actions
    approveOrder,
    rejectOrderWithReason,
    selectApprover,
  };
};

// ============================================================================
// EXAMPLE COMPONENTS USING COMPOSITE HOOKS
// ============================================================================

/**
 * Order creation wizard component
 */
export const OrderCreationWizard: React.FC = () => {
  const {
    currentStep,
    selectedApplicant,
    applicantGifts,
    canGoNext,
    proceedToNext,
    completeApplicantSelection,
    completeGiftSelection,
    submitOrder,
    goToPreviousStep,
  } = useOrderCreationWorkflow();

  const { selectApprover, approverList } = useApproverSelection();

  if (!currentStep) {
    return <div>Loading...</div>;
  }

  const renderStepContent = () => {
    switch (currentStep.id) {
      case "applicant-selection":
        return (
          <div>
            <h3>Select Applicants</h3>
            {/* Applicant selection UI */}
            <button
              onClick={() => {
                // Mock applicant selection - should be one applicant
                const mockApplicant: Person = {
                  publicId: "example-public-id-123",
                  firstName: "John",
                  lastName: "Doe",
                  sourceFormat: ExcelFormatType.COMPLETE_EMPLOYEE,
                };
                completeApplicantSelection(mockApplicant);
              }}
            >
              Complete Applicant Selection
            </button>
          </div>
        );

      case "gift-selection":
        return (
          <div>
            <h3>Select Gifts</h3>
            {/* Gift selection UI */}
            <button
              onClick={() => {
                // Mock gift selection
                const mockGifts: Gift[] = []; // Would come from form
                completeGiftSelection(mockGifts);
              }}
            >
              Complete Gift Selection
            </button>
          </div>
        );

      case "order-confirmation":
        return (
          <div>
            <h3>Confirm Order</h3>
            {/* Order summary UI */}
            <button
              onClick={() => {
                // Mock approver selection
                if (
                  approverList._tag === "Some" &&
                  approverList.value.length > 0
                ) {
                  submitOrder(approverList.value[0]);
                }
              }}
            >
              Submit Order
            </button>
          </div>
        );

      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className="order-wizard">
      <div className="step-header">
        <h2>{currentStep.title}</h2>
        {currentStep.description && <p>{currentStep.description}</p>}
      </div>

      <div className="step-content">{renderStepContent()}</div>

      <div className="step-navigation">
        <button onClick={() => goToPreviousStep()} disabled={!canGoNext}>
          Previous
        </button>

        <button onClick={() => proceedToNext()} disabled={!canGoNext}>
          Next
        </button>
      </div>
    </div>
  );
};

/**
 * Order approval dashboard component
 */
export const OrderApprovalDashboard: React.FC = () => {
  const {
    order,
    selectedApprover,
    approverList,
    approveOrder,
    rejectOrderWithReason,
  } = useOrderApprovalWorkflow();

  const [rejectionReason, setRejectionReason] = React.useState("");
  const [approvalNotes, setApprovalNotes] = React.useState("");

  if (order._tag !== "Some") {
    return <div>No order available</div>;
  }

  const orderValue = order.value;

  return (
    <div className="approval-dashboard">
      <div className="order-summary">
        <h3>Order #{orderValue.publicId || orderValue.orderId}</h3>
        <p>Status: {orderValue.status}</p>
        <p>Created: {orderValue.createdAt?.toDateString()}</p>
      </div>

      <div className="approval-actions">
        <div className="approve-section">
          <h4>Approve Order</h4>
          <textarea
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            placeholder="Approval notes (optional)"
          />
          <button
            onClick={() => {
              if (
                approverList._tag === "Some" &&
                approverList.value.length > 0
              ) {
                approveOrder(approverList.value[0], approvalNotes);
              }
            }}
            disabled={orderValue.status !== "pending"}
          >
            Approve Order
          </button>
        </div>

        <div className="reject-section">
          <h4>Reject Order</h4>
          <input
            type="text"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Rejection reason (required)"
          />
          <button
            onClick={() => {
              if (
                approverList._tag === "Some" &&
                approverList.value.length > 0 &&
                rejectionReason.trim()
              ) {
                rejectOrderWithReason(approverList.value[0], rejectionReason);
              }
            }}
            disabled={
              orderValue.status !== "pending" || !rejectionReason.trim()
            }
          >
            Reject Order
          </button>
        </div>
      </div>

      {selectedApprover._tag === "Some" &&
        selectedApprover.value._tag === "Some" && (
          <div className="selected-approver">
            <p>Selected Approver: {selectedApprover.value.value.name}</p>
          </div>
        )}
    </div>
  );
};

// ============================================================================
// CONTEXT COMPOSITION UTILITIES
// ============================================================================

/**
 * withFunctionalContexts (Public API)
 * Higher-order component for composing all functional contexts around a component.
 *
 * @param Component React.ComponentType<P> - The component to wrap
 * @param contextConfig Object - Configuration for context providers
 * @returns Wrapped component with all contexts applied
 * @sideEffects Instantiates context providers
 * @notes Useful for testing or storybook setups
 */
export function withFunctionalContexts<P extends object>(
  Component: React.ComponentType<P>,
  contextConfig: {
    applicants?: Person[];
    gifts?: Gift[];
    order?: Order;
    approverList?: Person[];
    multistepSteps?: StepDefinition[];
  }
) {
  return function WrappedComponent(props: P) {
    return (
      <CombinedContextProvider
        contexts={{
          applicant: contextConfig.applicants
            ? {
                applicantList: contextConfig.applicants,
              }
            : undefined,
          gift: contextConfig.gifts
            ? { giftList: contextConfig.gifts }
            : undefined,
          order:
            contextConfig.order && contextConfig.approverList
              ? {
                  order: contextConfig.order,
                  approverList: contextConfig.approverList,
                }
              : undefined,
          multistep: contextConfig.multistepSteps
            ? { steps: contextConfig.multistepSteps }
            : undefined,
        }}
      >
        <Component {...props} />
      </CombinedContextProvider>
    );
  };
}

/**
 * useContextSynchronization (Public API)
 *
 * Hook for managing and synchronizing state across multiple contexts.
 * Useful for keeping related context data in sync (e.g., applicant selection and order context).
 *
 * @returns Object with synchronization utilities
 * @sideEffects May trigger context updates or server syncs
 * @notes Example only; extend for real cross-context sync logic
 */
export const useContextSynchronization = () => {
  const { selectedApplicant } = useApplicantSelection();
  const { order } = useOrderStatus();
  const { setStepData } = useStepData();

  // Sync applicant selection with order context
  React.useEffect(() => {
    if (selectedApplicant._tag === "Some" && order._tag === "Some") {
      // Update order with selected applicant
      // This would typically trigger a server update
    }
  }, [selectedApplicant, order]);

  // Sync step data with context changes
  React.useEffect(() => {
    if (selectedApplicant._tag === "Some") {
      setStepData("current-step", {
        applicant: selectedApplicant.value,
        updatedAt: Date.now(),
      });
    }
  }, [selectedApplicant, setStepData]);

  return {
    // State synchronization utilities
    syncApplicantWithOrder: () => {
      // Implementation for manual sync
    },
    syncStepWithContexts: () => {
      // Implementation for manual sync
    },
  };
};

export default {
  CombinedContextProvider,
  useOrderCreationWorkflow,
  useOrderApprovalWorkflow,
  OrderCreationWizard,
  OrderApprovalDashboard,
  withFunctionalContexts,
  useContextSynchronization,
};

/**
 * Context Integration Examples
 * Demonstrates how to use multiple enhanced functional contexts together
 */

import React from "react";
import {
  Result,
  Maybe,
  some,
  none,
  success,
  failure,
  pipe,
} from "@/lib/fp-utils";

// Enhanced context imports
import {
  ApplicantProvider,
  useApplicantSelection,
  useGiftManagement,
  usePersonSelection,
} from "@/app/contexts/EnhancedApplicantContext";

import {
  OrderProvider,
  useOrderStatus,
  useApproverSelection,
  useOrderTracking,
} from "@/app/contexts/EnhancedOrderContext";

import {
  MultistepProvider,
  useStepNavigation,
  useStepData,
  useStepValidation,
  StepDefinition,
} from "@/app/contexts/EnhancedMultistepContext";

// Model imports
import { Order } from "@/database/models/order.model";
import { Person } from "@/database/models/person.model";
import { Gift } from "@/database/models/gift.model";
import { Types } from "mongoose";

// Helper function to get person name
const getPersonName = (person: Person): string => {
  return `${person.firstName} ${person.lastName}`;
};

// ============================================================================
// COMBINED CONTEXT PROVIDER
// ============================================================================

interface CombinedProviderProps {
  children: React.ReactNode;
  order: Order;
  applicants: Person[];
  approverList: Person[];
  gifts: Gift[];
  multistepSteps: StepDefinition[];
}

/**
 * Combined provider that sets up all functional contexts
 */
export const CombinedContextProvider: React.FC<CombinedProviderProps> = ({
  children,
  order,
  applicants,
  approverList,
  gifts,
  multistepSteps,
}) => {
  return (
    <ApplicantProvider
      eventId={order._id?.toString() || ""}
      applicantList={applicants}
      giftList={gifts}
      approverList={approverList}
    >
      <OrderProvider order={order} approverList={approverList}>
        <MultistepProvider steps={multistepSteps}>{children}</MultistepProvider>
      </OrderProvider>
    </ApplicantProvider>
  );
};

// ============================================================================
// COMPOSITE HOOKS FOR COMPLEX OPERATIONS
// ============================================================================

/**
 * Composite hook for managing order creation workflow
 */
export const useOrderCreationWorkflow = () => {
  // Context hooks
  const { selectedApplicant, selectApplicant } = useApplicantSelection();
  const { applicantGifts, addGift } = useGiftManagement();
  const { order, confirmOrder, rejectOrder } = useOrderStatus();
  const { currentStep, goToNextStep, goToPreviousStep, canGoNext } =
    useStepNavigation();
  const { setStepData, getCurrentStepData } = useStepData();
  const { validateStep } = useStepValidation();
  const { addNotification } = useOrderTracking();

  /**
   * Validates current step and proceeds to next if valid
   */
  const validateAndProceed = React.useCallback(async () => {
    if (!currentStep) return failure(new Error("No current step"));

    // Validate current step data
    const currentData = getCurrentStepData();
    const validationResult = await validateStep(currentStep.id, currentData);

    if (validationResult._tag === "Failure") {
      addNotification({
        type: "error",
        message: `Validation failed: ${validationResult.value}`,
      });
      return validationResult;
    }

    // Proceed to next step
    return goToNextStep();
  }, [
    currentStep,
    getCurrentStepData,
    validateStep,
    goToNextStep,
    addNotification,
  ]);

  /**
   * Completes applicant selection step
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

      return validateAndProceed();
    },
    [selectApplicant, setStepData, addNotification, validateAndProceed]
  );
  /**
   * Completes gift selection step
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

      return validateAndProceed();
    },
    [addGift, setStepData, addNotification, validateAndProceed]
  );

  /**
   * Submits the complete order
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

      if (applicantGifts._tag !== "Some" || applicantGifts.value.length === 0) {
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
            gifts: applicantGifts.value,
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
    validateAndProceed,
    completeApplicantSelection,
    completeGiftSelection,
    submitOrder,
    goToPreviousStep,
  };
};

/**
 * Composite hook for order approval workflow
 */
export const useOrderApprovalWorkflow = () => {
  const { order, confirmOrder, rejectOrder } = useOrderStatus();
  const { selectedApprover, selectApprover, approverList } =
    useApproverSelection();
  const { addHistoryEntry, addNotification } = useOrderTracking();

  /**
   * Approves an order with validation
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
    validateAndProceed,
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
                  _id: new Types.ObjectId(),
                  firstName: "John",
                  lastName: "Doe",
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

        <button onClick={() => validateAndProceed()} disabled={!canGoNext}>
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
        <h3>Order #{orderValue._id}</h3>
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
 * Higher-order component for context composition
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
        applicants={contextConfig.applicants || []}
        gifts={contextConfig.gifts || []}
        order={contextConfig.order || ({} as Order)}
        approverList={contextConfig.approverList || []}
        multistepSteps={contextConfig.multistepSteps || []}
      >
        <Component {...props} />
      </CombinedContextProvider>
    );
  };
}

/**
 * Hook for managing cross-context state synchronization
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

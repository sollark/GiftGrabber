/**
 * Context Integration Examples
 * Provides advanced integration patterns for combining multiple functional React contexts (Applicant, Gift, Order, Multistep) in a single provider tree.
 * Main Responsibilities:
 * - Defines a combined provider for orchestrating context setup and data flow across the app's main business workflows (order creation, approval, etc.)
 * - Implements composite hooks that encapsulate multi-context business logic for order creation and approval.
 * - Provides example UI components and utilities for context composition and cross-context state synchronization.
 * Architectural Role:
 * - Sits at the integration layer, bridging domain contexts and UI workflows.
 * - Encapsulates business process logic that spans multiple contexts.
 * - Promotes separation of concerns by keeping context setup and workflow logic out of UI components.
 */

import React from "react";
import { failure, isSome } from "@/utils/fp";

// Enhanced context imports
import {
  ApplicantProvider,
  useSelectedApplicant,
} from "@/app/contexts/ApplicantContext";
import { GiftProvider, useGiftContext } from "@/app/contexts/gift/GiftContext";
import {
  OrderProvider,
  useOrderStatus,
  useOrderTracking,
} from "@/app/contexts/order/OrderContext";
import {
  MultistepProvider,
  useStepNavigation,
  useStepData,
} from "@/app/contexts/multistep/MultistepContext";
import { StepDefinition } from "@/app/contexts/multistep/types";

// Model imports
import { Order } from "@/database/models/order.model";
import { Person } from "@/database/models/person.model";
import { Gift } from "@/database/models/gift.model";
import { ExcelFormatType } from "@/types/excel.types";

// Helper function to get person name
/**
 * Returns the full name of a person.
 * @param person - Person object
 * @returns string
 */
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
    order?: { order: Order };
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
      <MultistepProvider steps={contexts.multistep.steps}>
        {children}
      </MultistepProvider>
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
  const selectedApplicant = useSelectedApplicant();
  // Use direct context access for actions
  const giftContext = useGiftContext();
  const applicantGifts = giftContext.state.data.applicantGifts;
  const giftDispatch = giftContext.dispatch;
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
    async (gift: Gift) => {
      if (giftDispatch) {
        giftDispatch({ type: "ADD_GIFT", payload: gift });
        return { _tag: "Success" };
      }
      return failure(new Error("Gift actions unavailable"));
    },
    [giftDispatch]
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
  const { getCurrentStepData, updateStepData } = useStepData();
  const { addNotification } = useOrderTracking();

  /**
   * Proceeds to next step with basic data check
   */

  /**
   * proceedToNext (Internal Helper)
   * Proceeds to the next step, validating required data for the current step.
   * @returns Promise<Result<void, Error>>
   */
  const proceedToNext = React.useCallback(async (): Promise<
    ReturnType<typeof failure> | { _tag: string; value?: any }
  > => {
    if (!currentStep) return failure(new Error("No current step"));
    const currentData = getCurrentStepData();
    if (!currentStep.isOptional && !currentData) {
      addNotification({
        type: "error",
        message: `Please complete ${currentStep.title}`,
      });
      return failure(new Error(`${currentStep.title} is required`));
    }
    return goToNextStep();
  }, [currentStep, getCurrentStepData, goToNextStep, addNotification]);

  /**
   * Completes applicant selection step
   */

  /**
   * completeApplicantSelection (Public API)
   * Completes the applicant selection step, updates context, and advances workflow.
   * @param applicant Person - The selected applicant
   * @returns Promise<Result<void, Error>>
   */
  const completeApplicantSelection = React.useCallback(
    async (
      applicant: Person
    ): Promise<ReturnType<typeof failure> | { _tag: string; value?: any }> => {
      // Applicant selection now handled via context or direct state update if needed
      // Applicant selection is now handled directly; always proceed unless context dispatch fails
      await updateStepData("applicant-selection", {
        selectedApplicant: applicant,
        completedAt: Date.now(),
      });
      addNotification({
        type: "success",
        message: `Applicant ${getPersonName(applicant)} selected`,
      });
      return proceedToNext();
    },
    [updateStepData, addNotification, proceedToNext]
  );
  /**
   * Completes gift selection step
   */

  /**
   * completeGiftSelection (Public API)
   * Completes the gift selection step, adds gifts, and advances workflow.
   * @param gifts Gift[] - Array of selected gifts
   * @returns Promise<Result<void, Error>>
   */
  const completeGiftSelection = React.useCallback(
    async (
      gifts: Gift[]
    ): Promise<ReturnType<typeof failure> | { _tag: string; value?: any }> => {
      const addResults = await Promise.all(gifts.map((gift) => addGift(gift)));
      const hasErrors = addResults.some(
        (result: any) => !result || result._tag === "Failure"
      );
      if (hasErrors) {
        addNotification({
          type: "error",
          message: "Failed to add some gifts",
        });
        return failure(new Error("Failed to add gifts"));
      }
      await updateStepData("gift-selection", {
        selectedGifts: gifts,
        completedAt: Date.now(),
      });
      addNotification({
        type: "success",
        message: `${gifts.length} gifts selected`,
      });
      return proceedToNext();
    },
    [addGift, updateStepData, addNotification, proceedToNext]
  );

  /**
   * Submits the complete order
   */

  /**
   * submitOrder (Public API)
   * Submits the completed order for approval, validating all required data.
   * @returns Promise<Result<void, Error>>
   */
  const submitOrder = React.useCallback(async (): Promise<
    ReturnType<typeof failure> | { _tag: string; value?: any }
  > => {
    if (!isSome(selectedApplicant)) {
      return failure(new Error("No applicant selected"));
    }
    if (!applicantGifts || applicantGifts.length === 0) {
      return failure(new Error("No gifts selected"));
    }
    await updateStepData("order-submission", {
      selectedApplicant: selectedApplicant.value,
      selectedGifts: applicantGifts,
      completedAt: Date.now(),
    });
    addNotification({
      type: "success",
      message: "Order submitted successfully!",
    });
    return proceedToNext();
  }, [
    selectedApplicant,
    applicantGifts,
    updateStepData,
    addNotification,
    proceedToNext,
  ]);

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
 *
 * @returns Object containing state and action handlers for the order approval workflow
 * @sideEffects Triggers context state changes, notifications, and history updates
 * @notes Handles validation and error notification for each approval action
 */
export const useOrderApprovalWorkflow = () => {
  const { order, confirmOrder, rejectOrder } = useOrderStatus();
  const { addHistoryEntry, addNotification } = useOrderTracking();

  /**
   * approveOrder (Public API)
   * Approves the current order and adds a history entry.
   * @returns Result<void, Error>
   */
  const approveOrder = React.useCallback(async () => {
    const result = await confirmOrder();
    if (!result || result._tag === "Failure") {
      addNotification({
        type: "error",
        message: "Failed to approve order",
      });
      return result;
    }
    addNotification({
      type: "success",
      message: "Order approved",
    });
    return result;
  }, [confirmOrder, addHistoryEntry, addNotification, order]);

  /**
   * rejectOrderWithReason (Public API)
   * Rejects the current order with a reason and adds a history entry.
   * @param reason string - Reason for rejection
   * @returns Result<void, Error>
   */
  const rejectOrderWithReason = React.useCallback(
    async (reason: string) => {
      const result = await rejectOrder(reason);
      if (!result || result._tag === "Failure") {
        addNotification({
          type: "error",
          message: "Failed to reject order",
        });
        return result;
      }
      // Safely extract order for history entry
      const orderValue = order ?? undefined;
      addHistoryEntry({
        action: "reject",
        actor: orderValue?.applicant ?? {
          publicId: "unknown",
          sourceFormat: ExcelFormatType.BASIC_NAME,
        },
        details: reason,
      });
      addNotification({
        type: "success",
        message: "Order rejected",
      });
      return result;
    },
    [rejectOrder, addHistoryEntry, addNotification, order]
  );

  return {
    order,
    approveOrder,
    rejectOrderWithReason,
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

  if (!currentStep) {
    return <div>Loading...</div>;
  }

  const renderStepContent = () => {
    switch (currentStep.id) {
      case "applicant-selection":
        return (
          <div>
            <h3>Select Applicant</h3>
            {/* Applicant selection UI goes here */}
            <button
              onClick={() => {
                // Mock applicant selection
                const mockApplicant: Person = {
                  publicId: "mock-id-1",
                  firstName: "John",
                  lastName: "Doe",
                  sourceFormat: ExcelFormatType.BASIC_NAME,
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
                submitOrder();
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
            ? { applicantList: contextConfig.applicants }
            : undefined,
          gift: contextConfig.gifts
            ? { giftList: contextConfig.gifts }
            : undefined,
          order: contextConfig.order
            ? { order: contextConfig.order }
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
  const selectedApplicant = useSelectedApplicant();
  const { order } = useOrderStatus();
  const { updateStepData } = useStepData();

  // Sync applicant selection with order context
  React.useEffect(() => {
    if (selectedApplicant && selectedApplicant._tag === "Some" && order) {
      // Update order with selected applicant
      // This would typically trigger a server update
    }
  }, [selectedApplicant, order]);

  // Sync step data with context changes
  React.useEffect(() => {
    if (selectedApplicant && selectedApplicant._tag === "Some") {
      updateStepData("current-step", {
        applicant: selectedApplicant.value,
        updatedAt: Date.now(),
      });
    }
  }, [selectedApplicant, updateStepData]);

  return {};
};

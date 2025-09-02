/* @file Context Integration Examples
 *
 * Purpose: Provides advanced integration patterns for combining multiple functional React contexts (Applicant, Gift, Order, Multistep) in a single provider tree.
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
  useApplicantSelector,
  useSelectedApplicant,
  useApplicantActions,
} from "@/app/contexts/ApplicantContext";
import {
  GiftProvider,
  useGiftSelector,
  useGiftActions,
} from "@/app/contexts/gift/GiftContext";
import {
  OrderProvider,
  useOrderStatus,
  useOrderTracking,
} from "@/app/contexts/order/OrderContext";
import MultistepContextAPI from "@/app/contexts/multistep/MultistepContext";
const { BaseMultistepProvider, useStepNavigation, useStepData } =
  MultistepContextAPI;
import { StepDefinition } from "@/app/contexts/multistep/types";

// Model imports
import { Order } from "@/database/models/order.model";
import { Person } from "@/database/models/person.model";
import { Gift } from "@/database/models/gift.model";
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
  gifts: Gift[];
  multistepSteps: StepDefinition[];
}

/**
 * @deprecated Use CombinedContextProvider with contexts prop instead
 */
export const LegacyCombinedContextProvider: React.FC<
  LegacyCombinedProviderProps
> = ({ children, order, applicants, gifts, multistepSteps }) => {
  return (
    <CombinedContextProvider
      contexts={{
        applicant: {
          applicantList: applicants,
        },
        gift: { giftList: gifts },
  order: { order },
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
  const selectedApplicant = useSelectedApplicant();
  const applicantActions = useApplicantActions();
  // Helper to select applicant using context actions
  const selectApplicant = React.useCallback(
    (applicant: Person) => {
      if (applicantActions._tag === "Some") {
        return applicantActions.value.dispatchSafe({
          type: "SELECT_APPLICANT",
          payload: applicant,
        });
      }
      return failure(new Error("Applicant actions unavailable"));
    },
    [applicantActions]
  );
  const applicantGifts = getMaybeOrElse<Gift[]>([])(
    useGiftSelector((state) => state.data.applicantGifts)
  );
  const giftActions = useGiftActions();
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
      if (giftActions._tag === "Some") {
        return giftActions.value.dispatchSafe({
          type: "ADD_GIFT",
          payload: gift,
        });
      }
      return failure(new Error("Gift actions unavailable"));
    },
    [giftActions]
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
   * @returns Result<void, Error> - Success or failure of the submission
   * @sideEffects Updates context, triggers notifications, saves step data
   * @notes Aggregates all workflow data for final submission
   */
  const submitOrder = React.useCallback(async () => {
    // Validate all required data
    if (!selectedApplicant || selectedApplicant._tag !== "Some") {
      return failure(new Error("No applicant selected"));
    }
    if (!applicantGifts || applicantGifts.length === 0) {
      return failure(new Error("No gifts selected"));
    }
    // Save step data
    await setStepData("order-submission", {
      selectedApplicant: selectedApplicant.value,
      selectedGifts: applicantGifts,
      completedAt: Date.now(),
    });
    addNotification({
      type: "success",
      message: "Order submitted successfully!",
    });
    return proceedToNext();
  }, [selectedApplicant, applicantGifts, setStepData, addNotification, proceedToNext]);

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
          /**
           * @file Context Integration Examples
           *
           * Purpose: Provides advanced integration patterns for combining multiple functional React contexts (Applicant, Gift, Order, Multistep) in a single provider tree.
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
              onClick={() => {}}
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
        <button onClick={() => goToPreviousStep()}>
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
            contextConfig.order
              ? {
                  order: contextConfig.order,
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
  const selectedApplicant = useSelectedApplicant();
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
}

/**
 * Comprehensive examples showing functional programming patterns in GiftGrabber
 * Demonstrates how to use the new FP utilities, hooks, and database operations
 */

import React, { useMemo, useCallback } from "react";
import {
  Result,
  Maybe,
  some,
  none,
  success,
  failure,
  pipe,
  compose,
  curry,
  tryAsync,
  arrayUtils,
  objectUtils,
} from "./fp-utils";
import {
  useResultState,
  useMaybeState,
  useAsyncResult,
  useSafeAsync,
  useFormValidation,
} from "./fp-hooks";
import {
  withDatabaseResult,
  executeWithDatabase,
  safeQuery,
  queryBuilder,
} from "./withDatabase";
import {
  useSafeContext,
  useCombinedContexts,
} from "../app/hooks/useSafeContext";
import { useMultistep } from "../app/hooks/useMultistep";

// ============================================================================
// DATABASE OPERATIONS WITH FUNCTIONAL PATTERNS
// ============================================================================

// Mock models for examples (replace with actual imports)
interface EventModel {
  create: (data: any) => Promise<any>;
}

interface OrderModel {
  findOne: (filter: any) => { exec: () => Promise<any> };
}

const mockEvent: EventModel = {
  create: async (data: any) => ({ ...data, _id: "mock-id" }),
};

const mockOrder: OrderModel = {
  findOne: (filter: any) => ({
    exec: async () => ({ ...filter, name: "Mock Order" }),
  }),
};

/**
 * Example: Enhanced event creation with Result-based error handling
 */
export const createEventSafely = withDatabaseResult(async (eventData: any) => {
  // Simple validation instead of complex pipeline for now
  if (!eventData.title || eventData.title.length < 3) {
    throw new Error("Title must be at least 3 characters");
  }

  if (!eventData.description) {
    throw new Error("Description is required");
  }

  // Create event with validated data
  const event = await mockEvent.create(eventData);
  return event;
});

/**
 * Example: Safe order retrieval with Maybe types
 */
export const findOrderSafely = async (orderId: string): Promise<Maybe<any>> => {
  const result = await safeQuery(() =>
    mockOrder.findOne({ _id: orderId }).exec()
  );

  return result._tag === "Success"
    ? result.value
      ? some(result.value)
      : none
    : none;
};

/**
 * Example: Composable gift filtering using array utilities
 */
export const filterAvailableGifts =
  (minPrice: number, maxPrice: number) => (gifts: any[]) => {
    return gifts
      .filter((gift: any) => !gift.claimed)
      .filter((gift: any) => gift.price >= minPrice && gift.price <= maxPrice)
      .sort((a: any, b: any) => a.price - b.price);
  };

// ============================================================================
// COMPONENT HOOKS EXAMPLES
// ============================================================================

/**
 * Example: Form state management with validation
 */
export function useEventForm() {
  const initialState = {
    title: "",
    description: "",
    startDate: "",
    maxParticipants: 10,
  };

  const validators = {
    title: (value: string) =>
      value.trim().length >= 3
        ? success(value.trim())
        : failure("Title must be at least 3 characters"),

    description: (value: string) =>
      value.trim().length >= 10
        ? success(value.trim())
        : failure("Description must be at least 10 characters"),

    startDate: (value: string) => {
      const date = new Date(value);
      return date > new Date()
        ? success(date)
        : failure("Start date must be in the future");
    },

    maxParticipants: (value: number) =>
      value > 0 && value <= 100
        ? success(value)
        : failure("Max participants must be between 1 and 100"),
  };

  const form = useFormValidation(initialState, validators);

  // Enhanced submit with Result handling
  const submitForm = async (): Promise<Result<any, string>> => {
    if (!form.validate()) {
      return failure("Please fix validation errors");
    }

    const result = await createEventSafely(form.values);
    return result._tag === "Success"
      ? success(result.value)
      : failure(result.error.message);
  };

  return {
    ...form,
    submitForm,
  };
}

/**
 * Example: Async data loading with Result types
 */
export function useEventData(eventId: string) {
  const {
    data,
    error,
    loading,
    execute: retry,
  } = useSafeAsync(() => findOrderSafely(eventId), { deps: [eventId] });

  // Transform Maybe<Event> to display-ready format
  const eventDisplay = useMemo(() => {
    if (data._tag === "Some" && data.value._tag === "Some") {
      return some({
        ...data.value.value,
        formattedDate: new Date(
          data.value.value.startDate || Date.now()
        ).toLocaleDateString(),
        isUpcoming:
          new Date(data.value.value.startDate || Date.now()) > new Date(),
      });
    }
    return none;
  }, [data]);

  return {
    event: eventDisplay,
    error,
    loading,
    retry,
  };
}

// ============================================================================
// MULTISTEP FORM EXAMPLE
// ============================================================================

// Mock components for the example
const PersonalInfoStepMock = React.createElement("div", {
  "data-component": "PersonalInfoStep",
});
const GiftSelectionStepMock = React.createElement("div", {
  "data-component": "GiftSelectionStep",
});
const ConfirmationStepMock = React.createElement("div", {
  "data-component": "ConfirmationStep",
});

/**
 * Example: Enhanced multistep order creation
 */
export function useOrderCreationFlow(eventId: string) {
  const [orderData, setOrderData] = useResultState<any>({});

  const steps = [
    {
      id: "personal-info",
      component: PersonalInfoStepMock,
      title: "Personal Information",
      validation: () =>
        orderData.name ? success(true) : failure("Name is required"),
      onExit: async () => {
        // Save progress to localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("orderDraft", JSON.stringify(orderData));
        }
      },
    },
    {
      id: "gift-selection",
      component: GiftSelectionStepMock,
      title: "Select Gifts",
      validation: () =>
        orderData.selectedGifts?.length > 0
          ? success(true)
          : failure("Please select at least one gift"),
    },
    {
      id: "confirmation",
      component: ConfirmationStepMock,
      title: "Confirm Order",
      validation: () => success(true),
    },
  ];

  const navigation = useMultistep(steps, {
    onComplete: async (data: any) => {
      const result = await createEventSafely({ ...data, eventId });
      if (result._tag === "Success") {
        // Clear draft
        if (typeof window !== "undefined") {
          localStorage.removeItem("orderDraft");
        }
        // Would redirect to success page in real app
        console.log(`Order created: ${result.value._id}`);
      }
    },
  });

  // Enhanced data management
  const updateStepData = useCallback(
    (stepId: string, data: any) => {
      setOrderData((prev) => ({
        ...prev.value,
        [stepId]: data,
      }));
      navigation.setStepData(stepId, data);
    },
    [setOrderData, navigation]
  );

  return {
    ...navigation,
    orderData,
    updateStepData,
  };
}

// ============================================================================
// CONTEXT USAGE EXAMPLES
// ============================================================================

// Mock contexts for the example
const mockOrderContext = React.createContext<any>(undefined);
const mockUserContext = React.createContext<any>(undefined);

/**
 * Example: Safe context access pattern (functional approach)
 */
export function createOrderSummaryLogic() {
  // Safe context access with Maybe types
  const getOrderContext = () => useSafeContext(mockOrderContext);
  const getUserContext = () => useSafeContext(mockUserContext);

  // Combine multiple contexts safely
  const getCombinedData = () =>
    useCombinedContexts(getOrderContext, getUserContext);

  const processContextData = () => {
    const combinedData = getCombinedData();

    if (combinedData._tag === "None") {
      return { error: "Required context not available" };
    }

    const [orderData, userData] = combinedData.value;
    return {
      summary: {
        title: `Order Summary for ${userData.name}`,
        orderDetails: orderData,
        userName: userData.name,
      },
    };
  };

  return {
    processContextData,
    getOrderContext,
    getUserContext,
  };
}

// ============================================================================
// UTILITY COMPOSITION EXAMPLES
// ============================================================================

/**
 * Example: Data transformation pipeline using standard array methods
 */
export const processOrdersData = (orders: any[]) => {
  // Sort by date (newest first)
  const sorted = orders.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Group by status
  const grouped = sorted.reduce((acc, order) => {
    const status = order.status;
    if (!acc[status]) acc[status] = [];
    acc[status].push(order);
    return acc;
  }, {} as Record<string, any[]>);

  // Transform to display format
  const transformed = Object.entries(grouped).reduce(
    (acc, [status, orders]) => {
      acc[status] = (orders as any[]).map((order: any) => ({
        ...order,
        displayDate: new Date(order.createdAt).toLocaleDateString(),
        canCancel:
          order.status === "pending" &&
          new Date(order.event.startDate) > new Date(),
      }));
      return acc;
    },
    {} as Record<string, any[]>
  );

  return transformed;
};

/**
 * Example: Simple validation composition
 */
export const validateOrderData = (orderData: any): Result<any, string> => {
  if (!orderData.applicantName || orderData.applicantName.trim().length === 0) {
    return failure("Applicant name is required");
  }

  if (!orderData.applicantEmail || !orderData.applicantEmail.includes("@")) {
    return failure("Valid email is required");
  }

  if (!orderData.selectedGifts || !Array.isArray(orderData.selectedGifts)) {
    return failure("Selected gifts is required");
  }

  if (
    orderData.selectedGifts.length === 0 ||
    orderData.selectedGifts.length > 5
  ) {
    return failure("Please select 1-5 gifts");
  }

  return success(orderData);
};

/**
 * Mock function for gift availability check
 */
const checkGiftAvailability = async (
  gifts: any[]
): Promise<Result<any[], Error>> => {
  // Mock implementation
  const available = gifts.filter((gift) => !gift.claimed);
  return available.length === gifts.length
    ? success(available)
    : failure(new Error("Some gifts are no longer available"));
};

/**
 * Mock function for order confirmation
 */
const sendOrderConfirmation = async (order: any): Promise<void> => {
  console.log(`Sending confirmation for order ${order._id}`);
};

/**
 * Example: Async operation composition
 */
export const processOrderSubmission = async (orderData: any) => {
  const result = await tryAsync(async () => {
    // 1. Validate data
    const validationResult = validateOrderData(orderData);
    if (validationResult._tag === "Failure") {
      throw new Error(validationResult.error);
    }

    // 2. Check gift availability
    const giftsResult = await checkGiftAvailability(
      validationResult.value.selectedGifts
    );
    if (giftsResult._tag === "Failure") {
      throw new Error("Some gifts are no longer available");
    }

    // 3. Create order
    const orderResult = await createEventSafely(validationResult.value);
    if (orderResult._tag === "Failure") {
      throw new Error("Failed to create order");
    }

    // 4. Send confirmation email
    await sendOrderConfirmation(orderResult.value);

    return orderResult.value;
  })();

  return result;
};

// ============================================================================
// MIGRATION HELPERS
// ============================================================================

/**
 * Example: Gradual migration from imperative to functional patterns
 */
export function createMigrationExample() {
  // Mock legacy context access
  const getLegacyData = () => ({ name: "Legacy User", id: 123 });

  // New functional approach (safe)
  const safeData = useSafeContext(mockOrderContext);

  // Hybrid approach during migration
  const data =
    process.env.USE_FUNCTIONAL_PATTERNS === "true"
      ? safeData
      : some(getLegacyData());

  return {
    hasData: data._tag === "Some",
    data: data._tag === "Some" ? data.value : null,
    displayComponent: data._tag === "Some" ? "OrderDisplay" : "LoadingSpinner",
  };
}

// ============================================================================
// TESTING UTILITIES
// ============================================================================

/**
 * Example: Testing functional components
 */
export const createTestOrder = () => ({
  id: "test-123",
  applicantName: "Test User",
  applicantEmail: "test@example.com",
  selectedGifts: [{ id: "gift-1", name: "Test Gift", price: 25 }],
  status: "pending",
  createdAt: new Date().toISOString(),
});

export const mockAsyncOperation = <T>(
  value: T,
  shouldFail: boolean = false,
  delay: number = 100
): Promise<Result<T, Error>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(shouldFail ? failure(new Error("Mock error")) : success(value));
    }, delay);
  });
};

export default {
  createEventSafely,
  findOrderSafely,
  filterAvailableGifts,
  useEventForm,
  useEventData,
  useOrderCreationFlow,
  processOrdersData,
  validateOrderData,
  processOrderSubmission,
  createMigrationExample,
  createTestOrder,
  mockAsyncOperation,
};

/**
 * @file context-validators.ts
 *
 * Purpose: Provides reusable validation utilities for functional contexts,
 * reducing code duplication across context implementations.
 *
 * Main Responsibilities:
 * - Generic validation functions for common context operations
 * - Type-safe validation with Result types
 * - Reusable business rule validation
 *
 * Architectural Role:
 * - Utility layer supporting context implementations
 * - Promotes consistency across context validation logic
 */

import { Result, success, failure } from "./fp";
import { FunctionalAction } from "@/utils/fp-contexts";

/**
 * createRequiredPayloadValidator (Public API)
 *
 * Creates a validator that ensures an action has a required payload.
 * @param actionType string - The action type to validate
 * @param payloadValidator (payload: any) => boolean - Custom payload validation
 * @returns Validation function
 * @sideEffects None
 */
export const createRequiredPayloadValidator =
  <T extends FunctionalAction>(
    actionType: string,
    payloadValidator?: (payload: any) => boolean
  ) =>
  (action: T): Result<boolean, string> => {
    if (action.type !== actionType) {
      return success(true);
    }

    if (!action.payload) {
      return failure(`${actionType} requires payload`);
    }

    if (payloadValidator && !payloadValidator(action.payload)) {
      return failure(`Invalid payload for ${actionType}`);
    }

    return success(true);
  };

/**
 * createListSizeValidator (Public API)
 *
 * Creates a validator that ensures a list doesn't exceed maximum size.
 * @param maxSize number - Maximum allowed size
 * @param getCurrentSize (state: any) => number - Function to get current size
 * @returns Validation function
 * @sideEffects None
 */
export const createListSizeValidator =
  <TState, TAction extends FunctionalAction>(
    maxSize: number,
    getCurrentSize: (state: TState) => number
  ) =>
  (action: TAction, state: TState): Result<boolean, string> => {
    const currentSize = getCurrentSize(state);
    if (currentSize >= maxSize) {
      return failure(`Maximum ${maxSize} items allowed`);
    }
    return success(true);
  };

/**
 * createExistsValidator (Public API)
 *
 * Creates a validator that ensures an item exists in a collection.
 * @param getCollection (state: any) => any[] - Function to get the collection
 * @param getItemId (item: any) => string - Function to get item ID
 * @returns Validation function
 * @sideEffects None
 */
export const createExistsValidator =
  <TState, TAction extends FunctionalAction, TItem>(
    getCollection: (state: TState) => TItem[],
    getItemId: (item: TItem) => string
  ) =>
  (action: TAction, state: TState): Result<boolean, string> => {
    if (!action.payload) {
      return failure("Item data required");
    }

    const collection = getCollection(state);
    const itemId = getItemId(action.payload);
    const exists = collection.some((item) => getItemId(item) === itemId);

    if (!exists) {
      return failure("Item not found in collection");
    }

    return success(true);
  };

/**
 * combineValidators (Public API)
 *
 * Combines multiple validators into a single validator function.
 * @param validators Array of validation functions
 * @returns Combined validation function
 * @sideEffects None
 * @notes Returns failure on first validation error
 */
export const combineValidators =
  <TState, TAction extends FunctionalAction>(
    ...validators: Array<
      (action: TAction, state: TState) => Result<boolean, string>
    >
  ) =>
  (action: TAction, state: TState): Result<boolean, string> => {
    for (const validator of validators) {
      const result = validator(action, state);
      if (result._tag === "Failure") {
        return result;
      }
    }
    return success(true);
  };

import { FC, useCallback } from "react";
import { useOrderStatus } from "@/app/contexts/order/OrderContext";
import { OrderStatus } from "@/types/common.types";
import { useSafeAsync } from "@/utils/fp-hooks";
import StyledButton from "./AccentButton";
import ErrorMessage from "@/ui/form/ErrorMessage";
import { useErrorHandler } from "@/components/ErrorBoundary";

/**
 * Functional ConfirmOrderButton component.
 * Handles order confirmation with safe async patterns, loading states, and enhanced error tracking.
 * Provides visual feedback during confirmation process and tracks confirmation failures.
 */
const ConfirmOrderButton: FC = () => {
  const orderStatus = useOrderStatus();
  const { handleError, errorCount, lastError } =
    useErrorHandler("ConfirmOrderButton");

  const order = orderStatus.order ?? null;
  const isOrderCompleted = order?.status === OrderStatus.COMPLETED;

  /**
   * Safe order confirmation with proper error handling, success navigation, and enhanced error tracking
   */
  const {
    error: confirmError,
    loading: isConfirming,
    execute: executeConfirmation,
  } = useSafeAsync(
    async () => {
      try {
        const result = await orderStatus.confirmOrder();
        if (result && result._tag === "Failure") {
          const error = new Error(
            result.error.message || "Order confirmation failed"
          );
          handleError(error); // Track the error
          throw error;
        }

        // Navigate on success
        window.location.reload();
        return true;
      } catch (error) {
        const trackableError =
          error instanceof Error ? error : new Error(String(error));
        handleError(trackableError); // Track any unexpected errors
        throw trackableError;
      }
    },
    {
      deps: [order],
      maxRetries: 1,
    }
  );

  const handleConfirmOrder = useCallback(() => {
    if (isConfirming || !order) return;
    executeConfirmation();
  }, [isConfirming, order, executeConfirmation]);

  if (isOrderCompleted) {
    return <span>Congratulations</span>;
  }

  return (
    <>
      <StyledButton
        onClick={handleConfirmOrder}
        disabled={!order || isConfirming}
      >
        {isConfirming ? "Confirming..." : "Confirm"}
      </StyledButton>
      {confirmError._tag === "Some" && (
        <div>
          <ErrorMessage message={confirmError.value.message} />
          {errorCount > 1 && (
            <div
              style={{ fontSize: "0.8em", color: "#666", marginTop: "0.25rem" }}
            >
              Failed {errorCount} times
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ConfirmOrderButton;

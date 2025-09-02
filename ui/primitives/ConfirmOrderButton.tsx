import { FC, useCallback } from "react";
import { useOrderStatus } from "@/app/contexts/order/OrderContext";
import { useSafeAsync } from "@/utils/fp-hooks";
import StyledButton from "./AccentButton";
import ErrorMessage from "@/ui/form/ErrorMessage";

/**
 * Functional ConfirmOrderButton component.
 * Handles order confirmation with safe async patterns, loading states, and error handling.
 * Provides visual feedback during confirmation process.
 */
const ConfirmOrderButton: FC = () => {
  const orderStatus = useOrderStatus();

  const order =
    orderStatus.order._tag === "Some" ? orderStatus.order.value : null;

  const isOrderCompleted = order?.status === "completed";

  /**
   * Safe order confirmation with proper error handling and success navigation
   */
  const {
    error: confirmError,
    loading: isConfirming,
    execute: executeConfirmation,
  } = useSafeAsync(
    async () => {
      const result = await orderStatus.confirmOrder();
      if (result._tag === "Failure") {
        throw new Error(result.error.message || "Order confirmation failed");
      }

      // Navigate on success
      window.location.reload();
      return true;
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
        <ErrorMessage message={confirmError.value.message} />
      )}
    </>
  );
};

export default ConfirmOrderButton;

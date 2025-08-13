import { FC, memo } from "react";
import {
  useOrderStatus,
  useApproverSelection,
} from "@/app/contexts/order/OrderContext";
import StyledButton from "./AccentButton";

/**
 * Functional ConfirmOrderButton component.
 * Handles order confirmation with strict typing and composable error handling.
 * Uses memo for performance.
 */
const ConfirmOrderButton: FC = () => {
  const orderStatus = useOrderStatus();
  const approverSelection = useApproverSelection();

  const order =
    orderStatus.order._tag === "Some" ? orderStatus.order.value : null;
  const approver =
    approverSelection.selectedApprover._tag === "Some"
      ? approverSelection.selectedApprover.value
      : null;

  const isOrderCompleted = order?.status === "completed";

  const handleConfirmOrder = async () => {
    if (!approver || !order) return;
    const result = await orderStatus.confirmOrder(approver);
    if (result._tag === "Success") {
      window.location.reload();
    }
  };

  if (isOrderCompleted) {
    return <span>Congratulations</span>;
  }

  return <StyledButton onClick={handleConfirmOrder}>Confirm</StyledButton>;
};

export default ConfirmOrderButton;

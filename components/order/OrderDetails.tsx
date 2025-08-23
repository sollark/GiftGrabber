import { FC, useMemo } from "react";
import { useOrderStatus } from "@/app/contexts/order/OrderContext";
import { useApproverSelection } from "@/app/contexts/ApproverContext";
import OrderGifts from "./OrderGifts";

/**
 * Formats a person's full name
 * @param person - Person object with firstName and lastName
 * @returns Formatted full name string
 */
const formatPersonName = (person: {
  firstName: string;
  lastName: string;
}): string => `${person.firstName} ${person.lastName}`;

/**
 * Functional OrderDetails component for displaying detailed order information.
 *
 * @returns JSX.Element containing order details or null if no order exists
 *
 * Responsibilities:
 * - Displays order date, applicant, and approver information
 * - Integrates with OrderGifts component for complete order view
 * - Uses OrderContext and ApproverContext for state management
 *
 * Performance:
 * - Uses memoized calculations for derived state
 * - Leverages React's built-in rendering optimizations
 * - No React.memo needed due to stable context subscriptions
 */
const OrderDetails: FC = () => {
  const orderStatus = useOrderStatus();
  const approverSelection = useApproverSelection();

  // Extract order and approver from Maybe types
  const order =
    orderStatus.order._tag === "Some" ? orderStatus.order.value : null;
  const approver =
    approverSelection.selectedApprover._tag === "Some" &&
    approverSelection.selectedApprover.value._tag === "Some"
      ? approverSelection.selectedApprover.value.value
      : null;

  // Memoized approver name calculation
  const approverName = useMemo(() => {
    if (
      order?.confirmedBy &&
      order.confirmedBy.firstName &&
      order.confirmedBy.lastName
    ) {
      return formatPersonName({
        firstName: order.confirmedBy.firstName,
        lastName: order.confirmedBy.lastName,
      });
    }
    if (approver && approver.firstName && approver.lastName) {
      return formatPersonName({
        firstName: approver.firstName,
        lastName: approver.lastName,
      });
    }
    return "";
  }, [order?.confirmedBy, approver]);

  // Early return if no order exists
  if (!order) return null;

  const { createdAt, applicant } = order;

  return (
    <div>
      <h2>Order Details</h2>
      <div>
        <p>
          <strong>Order date:</strong> {new Date(createdAt).toLocaleString()}
        </p>
        <p>
          <strong>Applicant:</strong>{" "}
          {applicant && applicant.firstName && applicant.lastName
            ? formatPersonName({
                firstName: applicant.firstName,
                lastName: applicant.lastName,
              })
            : "N/A"}
        </p>
        <p>
          <strong>Approver:</strong> {approverName}
        </p>
        <OrderGifts />
      </div>
    </div>
  );
};

export default OrderDetails;

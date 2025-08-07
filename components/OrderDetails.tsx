import {
  useOrderStatus,
  useApproverSelection,
} from "@/app/contexts/OrderContext";
import React, { useMemo } from "react";
import GiftList from "./GiftList";

/**
 * Formats a person's full name
 * @param person - Person object with firstName and lastName
 * @returns Formatted full name string
 */
const formatPersonName = (person: {
  firstName: string;
  lastName: string;
}): string => {
  return `${person.firstName} ${person.lastName}`;
};

/**
 * Component for displaying detailed order information including applicant, approver, and gifts
 */
const OrderDetails: React.FC = () => {
  const orderStatus = useOrderStatus();
  const approverSelection = useApproverSelection();

  // Extract order and approver from Maybe types
  const order =
    orderStatus.order._tag === "Some" ? orderStatus.order.value : null;
  const approver =
    approverSelection.selectedApprover._tag === "Some"
      ? approverSelection.selectedApprover.value
      : null;

  // Memoized approver name calculation
  const approverName = useMemo(() => {
    if (order?.confirmedBy) {
      return formatPersonName(order.confirmedBy);
    }
    if (approver) {
      return formatPersonName(approver);
    }
    return "";
  }, [order?.confirmedBy, approver]);

  // Early return if no order exists
  if (!order) {
    return null;
  }

  const { createdAt, applicant, gifts } = order;

  return (
    <div>
      <h2>Order Details</h2>
      <div>
        <p>
          <strong>Order date:</strong> {new Date(createdAt).toLocaleString()}
        </p>
        <p>
          <strong>Applicant:</strong> {formatPersonName(applicant)}
        </p>
        <p>
          <strong>Approver:</strong> {approverName}
        </p>
        <GiftList gifts={gifts} />
      </div>
    </div>
  );
};

export default OrderDetails;

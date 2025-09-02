import { FC } from "react";
import { useOrderStatus } from "@/app/contexts/order/OrderContext";
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
 * - Displays order date, applicant information
 * - Integrates with OrderGifts component for complete order view
 * - Uses OrderContext  for state management
 *
 * Performance:
 * - Uses memoized calculations for derived state
 * - Leverages React's built-in rendering optimizations
 * - No React.memo needed due to stable context subscriptions
 */
const OrderDetails: FC = () => {
  const orderStatus = useOrderStatus();

  // Extract order from context (null/undefined safe)
  const order = orderStatus.order ?? null;

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

        <OrderGifts />
      </div>
    </div>
  );
};

export default OrderDetails;

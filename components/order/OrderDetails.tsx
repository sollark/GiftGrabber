import { FC } from "react";
import useSWR from "swr";
import ApplicantDetails from "../applicant/ApplicantDetails";

export interface OrderDetailsProps {
  publicOrderId: string;
  eventId: string;
}

/**
 * Fetches order details by publicOrderId and eventId.
 * @param publicOrderId - The public order identifier
 * @param eventId - The event identifier
 * @returns Order object or null
 */
const fetchOrder = async (publicOrderId: string, eventId: string) => {
  const res = await fetch(`/api/events/${eventId}/orders/${publicOrderId}`);
  if (!res.ok) throw new Error("Failed to fetch order details");
  return res.json();
};

/**
 * OrderDetails
 * Displays order information and applicant details.
 * @param publicOrderId - The public order identifier
 * @param eventId - The event identifier
 */
const OrderDetails: FC<OrderDetailsProps> = ({ publicOrderId, eventId }) => {
  const { data: order, error } = useSWR(
    publicOrderId && eventId ? [`order`, publicOrderId, eventId] : null,
    () => fetchOrder(publicOrderId, eventId)
  );

  if (error) return <div>Error loading order details.</div>;
  if (!order) return <div>Loading...</div>;

  const { createdAt, applicant } = order;

  return (
    <div>
      <h2>Order Details</h2>
      <div>
        <p>
          <strong>Order date:</strong>{" "}
          {createdAt ? new Date(createdAt).toLocaleString() : "N/A"}
        </p>
        <p>
          <strong>Applicant:</strong>{" "}
          {applicant && applicant.publicId ? (
            <ApplicantDetails publicId={applicant.publicId} />
          ) : (
            "N/A"
          )}
        </p>
      </div>
    </div>
  );
};

export default OrderDetails;

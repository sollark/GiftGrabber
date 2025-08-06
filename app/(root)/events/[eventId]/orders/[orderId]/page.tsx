import ConfirmOrder from "@/components/ConfirmOrder";

// User's original type for reference (not used by Next.js, but preserved as requested)
type SearchParamProps = {
  params: {
    eventId: string;
    orderId: string;
  };
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ eventId: string; orderId: string }>;
}) {
  const { eventId, orderId } = await params;
  // const order = await getOrder(orderId)

  return (
    <div>
      <ConfirmOrder orderId={orderId} eventId={eventId} />
    </div>
  );
}

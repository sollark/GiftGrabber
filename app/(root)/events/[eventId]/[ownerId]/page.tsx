import { getEventDetails } from "@/app/actions/event.action";
import EventDetailsClient from "./EventDetailsClient";

export default async function EventDetails({
  params,
}: {
  params: Promise<{ eventId: string; ownerId: string }>;
}) {
  const { eventId, ownerId } = await params; //

  const event = await getEventDetails(eventId);
  if (!event) return <div>Event not found</div>;

  const { applicantList, giftList, approverList } = event;

  return (
    <EventDetailsClient
      applicantList={applicantList}
      giftList={giftList}
      approverList={approverList}
    />
  );
}

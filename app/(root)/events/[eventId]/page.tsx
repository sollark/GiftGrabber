import { getEventDetails } from "@/app/actions/event.action";
import ApplicantPageClient from "./ApplicantPageClient";
// User's original type for reference (not used by Next.js, but preserved as requested)
type SearchParamProps = {
  params: {
    eventId: string;
  };
};

export default async function ApplicantPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await getEventDetails(eventId);
  if (!event) return <div>Event not found</div>;

  return <ApplicantPageClient event={event} />;
}

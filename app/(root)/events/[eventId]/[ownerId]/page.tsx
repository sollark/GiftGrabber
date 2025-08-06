import { getEventDetails } from "@/app/actions/event.action";
import ApproverList from "@/components/ApproverList";
import { Gift } from "@/database/models/gift.model";
import { Person } from "@/database/models/person.model";

// User's original type for reference (not used by Next.js, but preserved as requested)
type SearchParamProps = {
  params: {
    eventId: string;
    ownerId: string;
  };
};

export default async function EventDetails({
  params,
}: {
  params: Promise<{ eventId: string; ownerId: string }>;
}) {
  const { eventId, ownerId } = await params;
  const event = await getEventDetails(eventId);
  if (!event) return <div>Event not found</div>;

  const { applicantList, giftList, approverList } = event;

  return (
    <div>
      <h1>Event Details</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Is Grabbed</th>
          </tr>
        </thead>
        <tbody>
          {applicantList.map((applicant: Person) => (
            <tr key={applicant._id.toString()}>
              <td>{`${applicant.firstName} ${applicant.lastName}`}</td>
              <td>
                {giftList.find((gift: Gift) => gift.owner._id === applicant._id)
                  ?.receiver
                  ? "Taken"
                  : "Available"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ApproverList personArray={approverList} />
    </div>
  );
}

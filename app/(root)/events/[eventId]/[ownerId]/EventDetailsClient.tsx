"use client";
import ApproverList from "@/components/ApproverList";
import { Gift } from "@/database/models/gift.model";
import { Person } from "@/database/models/person.model";

interface EventDetailsClientProps {
  applicantList: Person[];
  giftList: Gift[];
  approverList: Person[];
}

/**
 * Client component for rendering event details and approver list.
 * Props:
 *   - applicantList: array of applicants
 *   - giftList: array of gifts
 *   - approverList: array of approvers
 * Returns: JSX.Element
 */
export default function EventDetailsClient({
  applicantList,
  giftList,
  approverList,
}: EventDetailsClientProps) {
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
                {giftList.find(
                  (gift: Gift) =>
                    gift.owner._id.toString() === applicant._id.toString()
                )?.receiver
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

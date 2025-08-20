"use client";
import ApproverList from "@/components/approver/ApproverList";
import { ApproverProvider } from "@/app/contexts/ApproverContext";
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
import { getPersonKey } from "@/utils/utils";

export default function EventDetailsClient({
  applicantList,
  giftList,
  approverList,
}: EventDetailsClientProps) {
  // No longer need eventId for ApproverProvider
  return (
    <ApproverProvider approverList={approverList}>
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
            {applicantList.map((applicant: Person, index: number) => (
              <tr key={getPersonKey(applicant, index)}>
                <td>{`${applicant.firstName} ${applicant.lastName}`}</td>
                <td>
                  {giftList.find(
                    (gift: Gift) =>
                      getPersonKey(gift.owner) === getPersonKey(applicant)
                  )?.applicant
                    ? "Taken"
                    : "Available"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <ApproverList personArray={approverList} />
      </div>
    </ApproverProvider>
  );
}

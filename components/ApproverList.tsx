import { Person } from "@/database/models/person.model";
import { FC } from "react";
import { useApproverSelection } from "@/app/contexts/ApproverContext";

type ApproverListProps = {
  personArray: Person[];
};

const ApproverList: FC<ApproverListProps> = ({ personArray }) => {
  // Use context for approver list, but preserve original rendering and props
  const { approverList } = useApproverSelection();

  // Prefer context value if available, else fallback to prop
  const list =
    approverList._tag === "Some" && Array.isArray(approverList.value)
      ? approverList.value
      : personArray;

  return (
    <div>
      <h3>Approvers</h3>
      <ul>
        {list.map((approver: Person) => (
          <li key={approver._id.toString()}>
            {`${approver.firstName} ${approver.lastName}`}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ApproverList;

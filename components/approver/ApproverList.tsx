import { Person } from "@/database/models/person.model";
import { FC } from "react";
import { useApproverSelection } from "@/app/contexts/ApproverContext";
import ListSkeleton from "@/components/ui/ListSkeleton";

type ApproverListProps = {
  personArray: Person[];
  isLoading?: boolean;
};

const ApproverList: FC<ApproverListProps> = ({
  personArray,
  isLoading = false,
}) => {
  // Use context for approver list, but preserve original rendering and props
  const { approverList } = useApproverSelection();

  // Prefer context value if available, else fallback to prop
  const list =
    approverList._tag === "Some" && Array.isArray(approverList.value)
      ? approverList.value
      : personArray;

  // Show loading skeleton when loading and no data
  if (isLoading && list.length === 0) {
    return <ListSkeleton title="Approvers" rows={2} columns={1} />;
  }

  return (
    <div>
      <h3>Approvers</h3>
      {list.length === 0 ? (
        <div className="text-gray-500 text-sm">No approvers available</div>
      ) : (
        <ul>
          {list.map((approver: Person, index: number) => (
            <li
              key={
                approver.publicId ||
                `${approver.firstName}-${approver.lastName}-${index}`
              }
            >
              {`${approver.firstName} ${approver.lastName}`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ApproverList;

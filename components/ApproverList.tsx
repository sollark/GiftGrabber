import { Person } from '@/database/models/person.model'
import { FC } from 'react'

type ApproverListProps = {
  personArray: Person[]
}

const ApproverList: FC<ApproverListProps> = ({ personArray }) => {
  return (
    <div>
      <h3>Approvers</h3>
      <ul>
        {personArray.map((approver: Person) => (
          <li key={approver._id.toString()}>
            {`${approver.firstName} ${approver.lastName}`}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ApproverList

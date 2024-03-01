import { Person } from '@/database/models/person.model'
import { FC, SyntheticEvent } from 'react'
import PersonAutocomplete, { OptionType } from './PersonAutocomplete'
import StyledButton from './StyledButton'

type ApproverProps = {
  approverList: Person[]
  onSelectApprover: (event: SyntheticEvent, value: OptionType | null) => void
}

const Approver: FC<ApproverProps> = ({
  approverList,
  onSelectApprover,
}: ApproverProps) => {
  return (
    <div>
      {/* <PersonAutocomplete
        peopleList={approverList}
        onChange={onSelectApprover}
      /> */}
      <StyledButton>Confirm</StyledButton>
    </div>
  )
}

export default Approver

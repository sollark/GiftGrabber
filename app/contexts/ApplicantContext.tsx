import { Gift } from '@/database/models/gift.model'
import { Person } from '@/database/models/person.model'
import {
  createContext,
  Dispatch,
  FC,
  ReactNode,
  SetStateAction,
  useState,
} from 'react'

type ApplicantProviderProps = {
  eventId: string
  approverList: Person[]
  applicantList: Person[]
  giftList: Gift[]
  children: ReactNode
}

type ApplicantContextValues = {
  // Event ID
  eventId: string
  // List of people that approves an order
  approverList: Person[]
  // List of all applicants
  applicantList: Person[]
  // Selected applicant that takes gifts
  applicant: Person | null
  setApplicant: Dispatch<SetStateAction<Person | null>>
  // Selected person from applicant list
  selectedPerson: Person | null
  setSelectedPerson: Dispatch<SetStateAction<Person | null>>
  // List of all gifts
  giftList: Gift[]
  // List of gifts for the applicant
  applicantGifts: Gift[]
  setApplicantGifts: Dispatch<SetStateAction<Gift[]>>
}

export const ApplicantContext = createContext<
  ApplicantContextValues | undefined
>(undefined)

export const ApplicantProvider: FC<ApplicantProviderProps> = ({
  eventId,
  approverList,
  applicantList,
  giftList,
  children,
}) => {
  const [applicant, setApplicant] = useState<Person | null>(null)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [applicantGifts, setApplicantGifts] = useState<Gift[]>([])

  const value = {
    eventId,
    approverList,
    applicantList,
    applicant,
    setApplicant,
    selectedPerson,
    setSelectedPerson,
    giftList,
    applicantGifts,
    setApplicantGifts,
  }

  return (
    <ApplicantContext.Provider value={value}>
      {children}
    </ApplicantContext.Provider>
  )
}

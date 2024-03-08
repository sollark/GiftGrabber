import { Gift } from '@/database/models/gift.model'
import { Person } from '@/database/models/person.model'
import { Types } from 'mongoose'
import {
  createContext,
  Dispatch,
  FC,
  ReactNode,
  SetStateAction,
  useState,
} from 'react'

type Context = {
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

type ApplicantProviderProps = {
  approverList: Person[]
  applicantList: Person[]
  giftList: Gift[]
  children: ReactNode
}

const initialContext: Context = {
  approverList: [],
  applicantList: [],
  applicant: null,
  setApplicant: () => null,
  selectedPerson: null,
  setSelectedPerson: () => null,
  giftList: [],
  applicantGifts: [],
  setApplicantGifts: () => [],
}

export const ApplicantContext = createContext<Context>(initialContext)

export const ApplicantProvider: FC<ApplicantProviderProps> = ({
  approverList,
  applicantList,
  giftList,
  children,
}) => {
  const [applicant, setApplicant] = useState<Person | null>(null)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [applicantGifts, setApplicantGifts] = useState<Gift[]>([])

  const value = {
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

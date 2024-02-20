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
  // List of all applicants
  applicantList: (Person & { _id: Types.ObjectId })[]
  // Applicant that takes gifts
  applicant: (Person & { _id: Types.ObjectId }) | null
  setApplicant: Dispatch<
    SetStateAction<(Person & { _id: Types.ObjectId }) | null>
  >
  // Selected person from applicant list
  selectedPerson: (Person & { _id: Types.ObjectId }) | null
  setSelectedPerson: Dispatch<
    SetStateAction<(Person & { _id: Types.ObjectId }) | null>
  >
  // List of all gifts
  giftList: (Gift & { _id: Types.ObjectId })[]
  // List of gifts for the applicant
  applicantGifts: (Gift & { _id: Types.ObjectId })[]
  setApplicantGifts: Dispatch<
    SetStateAction<(Gift & { _id: Types.ObjectId })[]>
  >
}

type ApplicantProviderProps = {
  applicantList: (Person & { _id: Types.ObjectId })[]
  giftList: (Gift & { _id: Types.ObjectId })[]
  children: ReactNode
}

export const ApplicantContext = createContext<Context>({
  applicantList: [],
  applicant: null,
  setApplicant: () => null,
  selectedPerson: null,
  setSelectedPerson: () => null,
  giftList: [],
  applicantGifts: [],
  setApplicantGifts: () => [],
})

export const ApplicantProvider: FC<ApplicantProviderProps> = ({
  applicantList,
  giftList,
  children,
}) => {
  const [applicant, setApplicant] = useState<
    (Person & { _id: Types.ObjectId }) | null
  >(null)
  const [selectedPerson, setSelectedPerson] = useState<
    (Person & { _id: Types.ObjectId }) | null
  >(null)
  const [applicantGifts, setApplicantGifts] = useState<
    (Gift & { _id: Types.ObjectId })[]
  >([])

  const value = {
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

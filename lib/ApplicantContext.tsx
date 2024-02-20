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
  applicants: (Person & { _id: Types.ObjectId })[]
  selectedPerson: (Person & { _id: Types.ObjectId }) | null
  setSelectedPerson: Dispatch<
    SetStateAction<(Person & { _id: Types.ObjectId }) | null>
  >
  selectedPeople: (Person & { _id: Types.ObjectId })[]
  setSelectedPeople: Dispatch<
    SetStateAction<(Person & { _id: Types.ObjectId })[]>
  >
}

type ApplicantProviderProps = {
  applicants: (Person & { _id: Types.ObjectId })[]
  children: ReactNode
}

export const ApplicantContext = createContext<Context>({
  applicants: [],
  selectedPerson: null,
  setSelectedPerson: () => null,
  selectedPeople: [],
  setSelectedPeople: () => [],
})

export const ApplicantProvider: FC<ApplicantProviderProps> = ({
  applicants,
  children,
}) => {
  const [selectedPerson, setSelectedPerson] = useState<
    (Person & { _id: Types.ObjectId }) | null
  >(null)
  const [selectedPeople, setSelectedPeople] = useState<
    (Person & { _id: Types.ObjectId })[]
  >([])

  const value = {
    applicants,
    selectedPerson,
    setSelectedPerson,
    selectedPeople,
    setSelectedPeople,
  }

  return (
    <ApplicantContext.Provider value={value}>
      {children}
    </ApplicantContext.Provider>
  )
}

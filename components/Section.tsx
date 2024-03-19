import { ReactNode } from 'react'

type SectionProps = {
  children: ReactNode
}

type SectionComponent = {
  (props: SectionProps): JSX.Element
  Title: (props: { children: ReactNode }) => JSX.Element
}

const Section: SectionComponent = ({ children }) => {
  return <section className='main-section'>{children}</section>
}

Section.Title = function SectionTitle({ children }) {
  return <h1>{children}</h1>
}

export default Section

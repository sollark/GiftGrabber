import Footer from '@/components/shared/Footer'
import Header from '@/components/shared/Header'
import Main from '@/components/shared/Main'
import { FC, ReactNode } from 'react'

type AppLayoutProps = {
  children: ReactNode
}

const AppLayout: FC<AppLayoutProps> = ({ children }: AppLayoutProps) => {
  return (
    <>
      <Header />
      <Main>{children}</Main>
      <Footer />
    </>
  )
}

export default AppLayout

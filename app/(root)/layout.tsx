import Footer from '@/components/shared/Footer'
import Header from '@/components/shared/Header'
import { ReactNode } from 'react'

type AppLayoutProps = {
  children: ReactNode
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <>
      <Header />
      <main
        style={{
          paddingBottom: '10rem',
        }}>
        {children}
      </main>
      <Footer />
    </>
  )
}

export default AppLayout

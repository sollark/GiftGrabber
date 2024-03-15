import Footer from '@/components/shared/Footer'
import Header from '@/components/shared/Header'
import { FC, ReactNode } from 'react'

type AppLayoutProps = {
  children: ReactNode
}

const AppLayout:FC<AppLayoutProps> = ({ children }: AppLayoutProps) => {
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

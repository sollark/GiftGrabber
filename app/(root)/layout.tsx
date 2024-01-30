import Footer from '@/components/shared/Footer'
import Header from '@/components/shared/Header'
import { ReactNode } from 'react'

type RootLayoutProps = {
  children: ReactNode
}

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <div>
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  )
}

export default RootLayout

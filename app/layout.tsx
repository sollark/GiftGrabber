import '@/styles/main.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gift Grabber',
  description:
    'Streamlining employee gifting for a seamless workplace gift-sharing experience.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en'>
      <body>
        <div className='main'>
          <div className='background' />
        </div>
        <main className='app'> {children}</main>
      </body>
    </html>
  )
}

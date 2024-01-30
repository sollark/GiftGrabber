import '@/styles/main.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gift Grabber',
  description:
    'Employee gifting platform for a seamless workplace gift-sharing experience.',
  icons: [
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      url: '/public/assets/favicons/favicon-32x32.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '16x16',
      url: '/public/assets/favicons/favicon-16x16.png',
    },
    {
      rel: 'apple-touch-icon',
      url: '/public/assets/favicons/apple-touch-icon.png',
    },
    { rel: 'manifest', url: '/public/assets/favicons/site.webmanifest' },
  ],
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

'use client'

import { useRouter } from 'next/navigation'
import AccentButton from './AccentButton'

const HeroButton = () => {
  const router = useRouter()

  return (
    <AccentButton
      className='hero-button'
      onClick={() => router.push('/create')}>
      Create an event
    </AccentButton>
  )
}

export default HeroButton

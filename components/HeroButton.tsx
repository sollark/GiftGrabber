'use client'
import { useRouter } from 'next/navigation'
import StyledButton from './StyledButton'

const HeroButton = () => {
  const router = useRouter()

  return (
    <StyledButton onClick={() => router.push('/create')}>
      Create an event
    </StyledButton>
  )
}

export default HeroButton

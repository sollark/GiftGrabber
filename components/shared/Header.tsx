import { FC } from 'react'
import Logo from '../Logo'

const Header: FC = () => {
  return (
    <header
      style={{
        paddingBlock: '1rem',
        paddingInline: '2rem',
      }}>
      <Logo />
    </header>
  )
}

export default Header

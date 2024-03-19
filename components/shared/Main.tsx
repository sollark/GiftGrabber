import React, { FC, ReactNode } from 'react'

type MainProps = {
  children: ReactNode
}

const Main: FC<MainProps> = ({ children }) => {
  return (
    <main
      style={{
        flexGrow: 1,
        paddingBlock: '1rem',
        paddingInline: '2rem',
        paddingBottom: '10rem',
      }}>
      {children}
    </main>
  )
}

export default Main

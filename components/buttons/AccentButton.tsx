import { tokens } from '@/ui/colorTokens'
import { Button, ButtonProps } from '@mui/material'
import { FC } from 'react'

const palette = tokens('light')

const AccentButton: FC<ButtonProps> = ({ children, ...props }) => {
  return (
    <Button
      sx={{
        backgroundColor: palette.accent[500],
        color: 'white',
        padding: '1rem',
        '&:hover': {
          backgroundColor: palette.accent[400],
          color: 'black',
        },
      }}
      {...props}>
      {children}
    </Button>
  )
}

export default AccentButton

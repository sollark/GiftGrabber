import { tokens } from '@/ui/colorTokens'
import { Button, ButtonProps } from '@mui/material'
import { FC } from 'react'

const palette = tokens('light')

const SecondaryButton: FC<ButtonProps> = ({ children, ...props }) => {
  return (
    <Button
      sx={{
        backgroundColor: palette.secondary[200],
        color: palette.secondary[700],
        padding: '1rem',
        '&:hover': {
          backgroundColor: palette.secondary[200],
          color: palette.secondary[800],
        },
      }}
      {...props}>
      {children}
    </Button>
  )
}

export default SecondaryButton

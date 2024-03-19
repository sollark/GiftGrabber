import { tokens } from '@/ui/colorTokens'
import { Button, ButtonProps } from '@mui/material'
import { FC } from 'react'

const palette = tokens('light')

const PrimaryButton: FC<ButtonProps> = ({ children, ...props }) => {
  return (
    <Button
      sx={{
        backgroundColor: palette.primary[200],
        color: palette.primary[700],
        padding: '1rem',
        '&:hover': {
          backgroundColor: palette.primary[200],
          color: palette.primary[800],
        },
      }}
      {...props}>
      {children}
    </Button>
  )
}

export default PrimaryButton

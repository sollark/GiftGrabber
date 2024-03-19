import { Button, ButtonProps } from '@mui/material'
import { FC } from 'react'

const StyledButton: FC<ButtonProps> = ({ children, ...props }) => {
  return (
    <Button
      sx={{
        backgroundColor: 'black',
        color: 'white',
        padding: '1rem',
        '&:hover': {
          backgroundColor: 'white',
          color: 'black',
        },
      }}
      {...props}>
      {children}
    </Button>
  )
}

export default StyledButton

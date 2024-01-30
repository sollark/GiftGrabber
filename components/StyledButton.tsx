import { Button, ButtonProps } from '@mui/material'

const StyledButton: React.FC<ButtonProps> = ({ children, ...props }) => {
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

type ErrorMessageProps = {
  message: String
}

const ErrorMessage = ({ message }: ErrorMessageProps) => {
  return <div>{message}</div>
}

export default ErrorMessage

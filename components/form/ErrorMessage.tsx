import { FC, memo } from "react";

type ErrorMessageProps = {
  message: string;
};

/**
 * Functional ErrorMessage component.
 * Renders an error message with strict typing and composable props.
 * Uses memo for performance.
 */
const ErrorMessage: FC<ErrorMessageProps> = memo(({ message }) => (
  <div>{message}</div>
));

export default ErrorMessage;

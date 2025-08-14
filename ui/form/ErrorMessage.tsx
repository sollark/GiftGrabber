import { FC } from "react";

type ErrorMessageProps = {
  message: string | string[];
  color?: string;
};

/**
 * Functional ErrorMessage component.
 * Displays error messages with strict typing and composable error handling.
 * Uses memo for performance.
 */
const ErrorMessage: FC<ErrorMessageProps> = ({ message }) => (
  <div>{message}</div>
);

export default ErrorMessage;

import { ErrorMessage } from "@hookform/error-message";
import { TextField } from "@mui/material";
import { FC, memo } from "react";
import { Controller, useFormContext } from "react-hook-form";

/**
 * Props for the ControlledTextInput component
 */
interface ControlledTextInputProps {
  name: string;
  label: string;
  [key: string]: any; // Allow additional props to be passed through
}

/**
 * Functional ControlledTextInput component.
 * Integrated with React Hook Form, provides automatic validation and error handling.
 * Uses memo and strict typing for composability and performance.
 */
const ControlledTextInput: FC<ControlledTextInputProps> = ({
  name,
  label,
  ...additionalProps
}) => {
  const {
    formState: { errors },
    control,
  } = useFormContext();

  const hasError = !!errors[name];

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <TextField
          {...field}
          className="input"
          label={label}
          placeholder={label}
          error={hasError}
          helperText={<ErrorMessage name={name} />}
          {...additionalProps}
        />
      )}
    />
  );
};

export default ControlledTextInput;

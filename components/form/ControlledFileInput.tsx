import { ErrorMessage } from "@hookform/error-message";
import { MuiFileInput } from "mui-file-input";
import { FC } from "react";
import { Controller, useFormContext } from "react-hook-form";

/**
 * Props for the ControlledFileInput component
 */
interface ControlledFileInputProps {
  name: string;
  label: string;
  [key: string]: any; // Allow additional props to be passed through
}

/**
 * Configuration for file input restrictions
 */
const FILE_INPUT_CONFIG = {
  ACCEPTED_FORMATS: ".xls,.xlsx",
  CSS_CLASS: "input",
} as const;

/**
 * Controlled file input component integrated with React Hook Form.
 * Specifically configured for Excel file uploads with validation.
 */
const ControlledFileInput: FC<ControlledFileInputProps> = ({
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
        <MuiFileInput
          {...field}
          className={FILE_INPUT_CONFIG.CSS_CLASS}
          label={label}
          placeholder={label}
          InputProps={{
            inputProps: {
              accept: FILE_INPUT_CONFIG.ACCEPTED_FORMATS,
            },
          }}
          error={hasError}
          helperText={<ErrorMessage name={name} />}
          {...additionalProps}
        />
      )}
    />
  );
};

export default ControlledFileInput;

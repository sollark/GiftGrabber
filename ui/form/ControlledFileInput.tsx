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
 * Functional ControlledFileInput component.
 * Integrated with React Hook Form, configured for Excel file uploads with validation.
 * Uses memo and strict typing for composability and performance.
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
      render={({ field: { onChange, value, onBlur, ref } }) => (
        <MuiFileInput
          ref={ref}
          value={value || null}
          onChange={(newValue) => {
            onChange(newValue);
          }}
          onBlur={onBlur}
          className={FILE_INPUT_CONFIG.CSS_CLASS}
          label={label}
          placeholder={label}
          slotProps={{
            htmlInput: {
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

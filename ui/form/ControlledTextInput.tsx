"use client";

/**
 * ControlledTextInput Component
 *
 * Purpose: Provides a reusable controlled text input component integrated with React Hook Form.
 *
 * Main Responsibilities:
 * - Renders a Material-UI TextField component within React Hook Form context
 * - Automatically handles form validation and error display
 * - Provides consistent styling and behavior across the application
 * - Manages form state and field registration through React Hook Form Controller
 * - Displays validation errors with proper accessibility and user feedback
 *
 * Architecture Role:
 * - Core UI form component that bridges Material-UI with React Hook Form
 * - Centralizes text input behavior and styling for form consistency
 * - Provides type-safe form field integration with automatic validation
 * - Enables reusable, composable form inputs throughout the application
 */

import { ErrorMessage } from "@hookform/error-message";
import { TextField } from "@mui/material";
import { FC, memo } from "react";
import { Controller, useFormContext } from "react-hook-form";

/**
 * Props interface for the ControlledTextInput component
 */
interface ControlledTextInputProps {
  /** Form field name for React Hook Form registration */
  name: string;
  /** Display label for the text input field */
  label: string;
  /** Additional props passed through to the underlying TextField component */
  [key: string]: any;
}

/**
 * ControlledTextInput Component
 *
 * A controlled text input component that integrates Material-UI TextField with React Hook Form.
 * Provides automatic validation, error handling, and consistent form field behavior.
 *
 * @param name - Form field name for React Hook Form registration and validation
 * @param label - Display label shown above the input field and as placeholder
 * @param additionalProps - Additional props passed through to the underlying TextField
 * @returns JSX.Element containing the controlled TextField with error handling
 *
 * @performance Memoized to prevent unnecessary re-renders when parent props are stable
 * @accessibility Includes proper error messaging and field labeling for screen readers
 */
const ControlledTextInput: FC<ControlledTextInputProps> = memo(
  function ControlledTextInput({ name, label, ...additionalProps }) {
    // Extract form context for validation and control
    const {
      formState: { errors },
      control,
    } = useFormContext();

    /**
     * Determines if the current field has validation errors
     *
     * @returns boolean - True if field has errors, false otherwise
     */
    const hasFieldError = (): boolean => {
      return !!errors[name];
    };

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
            error={hasFieldError()}
            helperText={<ErrorMessage name={name} />}
            {...additionalProps}
          />
        )}
      />
    );
  }
);

export default ControlledTextInput;

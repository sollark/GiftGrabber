"use client";

/**
 * ControlledFileInput Component
 *
 * Purpose: Provides a reusable controlled file input component integrated with React Hook Form and MUI.
 *
 * Main Responsibilities:
 * - Renders a Material-UI file input component within React Hook Form context
 * - Handles file upload functionality with automatic validation and error display
 * - Restricts file uploads to Excel formats (.xls, .xlsx) for data processing
 * - Manages form state and field registration through React Hook Form Controller
 * - Provides consistent styling and behavior for file inputs across the application
 * - Displays validation errors with proper accessibility and user feedback
 *
 * Architecture Role:
 * - Core UI form component that bridges MUI file input with React Hook Form
 * - Centralizes file input behavior and Excel file restrictions
 * - Provides type-safe form field integration with automatic validation
 * - Enables reusable, composable file inputs throughout the application
 * - Supports file processing workflows for Excel data import functionality
 */

import { ErrorMessage } from "@hookform/error-message";
import { MuiFileInput } from "mui-file-input";
import { FC, memo, useCallback } from "react";
import { Controller, useFormContext } from "react-hook-form";

/**
 * Props interface for the ControlledFileInput component
 */
interface ControlledFileInputProps {
  /** Form field name for React Hook Form registration */
  name: string;
  /** Display label for the file input field */
  label: string;
  /** Additional props passed through to the underlying MuiFileInput component */
  [key: string]: any;
}

/**
 * Configuration constants for file input restrictions and styling
 */
const FILE_INPUT_CONFIG = {
  /** Accepted file formats for Excel files */
  ACCEPTED_FORMATS: ".xls,.xlsx",
  /** CSS class applied to the file input component */
  CSS_CLASS: "input",
} as const;

/**
 * ControlledFileInput Component
 *
 * A controlled file input component that integrates MUI file input with React Hook Form.
 * Specifically configured for Excel file uploads with automatic validation and error handling.
 *
 * @param name - Form field name for React Hook Form registration and validation
 * @param label - Display label shown above the file input field and as placeholder
 * @param additionalProps - Additional props passed through to the underlying MuiFileInput
 * @returns JSX.Element containing the controlled file input with Excel format restrictions
 *
 * @performance Memoized to prevent unnecessary re-renders when parent props are stable
 * @accessibility Includes proper error messaging and field labeling for screen readers
 * @fileTypes Restricted to Excel formats (.xls, .xlsx) for data processing workflows
 */
const ControlledFileInput: FC<ControlledFileInputProps> = memo(
  function ControlledFileInput({ name, label, ...additionalProps }) {
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

    /**
     * Handles file change events with proper null handling
     * Optimized with useCallback to prevent unnecessary re-renders
     *
     * @param newValue - The new file value from MuiFileInput
     * @param onChange - React Hook Form onChange handler
     */
    const handleFileChange = useCallback(
      (newValue: File | null, onChange: (value: File | null) => void) => {
        onChange(newValue);
      },
      []
    );

    return (
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value, onBlur, ref } }) => (
          <MuiFileInput
            ref={ref}
            value={value || null}
            onChange={(newValue) => handleFileChange(newValue, onChange)}
            onBlur={onBlur}
            className={FILE_INPUT_CONFIG.CSS_CLASS}
            label={label}
            placeholder={label}
            slotProps={{
              htmlInput: {
                accept: FILE_INPUT_CONFIG.ACCEPTED_FORMATS,
              },
            }}
            error={hasFieldError()}
            helperText={<ErrorMessage name={name} />}
            {...additionalProps}
          />
        )}
      />
    );
  }
);

export default ControlledFileInput;

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FC, ReactElement, ReactNode, memo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { AccentButton as StyledButton } from "../primitives";

/**
 * Form configuration object for better parameter management
 */
interface FormConfig {
  schema: any;
  defaultValues?: any;
  submitButton?: ReactElement;
}

/**
 * Props for the Form component
 */
interface FormProps extends FormConfig {
  children: ReactNode;
  submit: (data: any) => void;
  [key: string]: any; // Allow additional props to be passed through
}

/**
 * Form configuration constants
 */
const FORM_CONFIG = {
  CRITERIA_MODE: "all" as const,
  VALIDATION_MODE: "onBlur" as const,
  REVALIDATION_MODE: "onBlur" as const,
  SUBMIT_BUTTON_TEXT: "Create",
} as const;

/**
 * Functional Form component.
 * Enhanced with React Hook Form integration, provides automatic validation, error handling, and form state management.
 * Uses memo and strict typing for composability and performance.
 */
const Form: FC<FormProps> = ({
  children,
  schema,
  defaultValues,
  submit,
  submitButton,
  ...additionalProps
}) => {
  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    criteriaMode: FORM_CONFIG.CRITERIA_MODE,
    mode: FORM_CONFIG.VALIDATION_MODE,
    reValidateMode: FORM_CONFIG.REVALIDATION_MODE,
  });

  const { handleSubmit } = methods;

  const handleFormSubmit = (data: any) => {
    submit(data);
  };

  const renderSubmitButton = () => {
    if (submitButton) return submitButton;
    return (
      <StyledButton type="submit">
        {FORM_CONFIG.SUBMIT_BUTTON_TEXT}
      </StyledButton>
    );
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(handleFormSubmit)} {...additionalProps}>
        {children}
        <div>{renderSubmitButton()}</div>
      </form>
    </FormProvider>
  );
};

export default Form;

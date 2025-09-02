"use client";
import { FC, ReactNode, useMemo } from "react";
import { BaseMultistepProvider } from "@/app/contexts/multistep/MultistepContext";
import { useStepNavigationActions } from "@/app/contexts/multistep/useStepNavigationActions";

/**
 * Props for the MultistepNavigator component
 */
interface MultistepNavigatorProps {
  children: ReactNode[];
  [key: string]: any;
}

/**
 * Internal component that renders the current step content
 * Uses memo for performance and strict typing.
 */
const StepRenderer: FC<{ children: ReactNode[] }> = ({ children }) => {
  const { navResult } = useStepNavigationActions();
  let currentStepContent = null;
  if (navResult._tag === "Success") {
    currentStepContent = children[navResult.value.currentStepIndex] || null;
  }
  return <>{currentStepContent}</>;
};

/**
 * Functional MultistepNavigator component.
 * Provides multistep navigation functionality to its children.
 * Converts ReactNode children into step definitions for the Enhanced context.
 * Uses memo and strict typing for composability and performance.
 */
const MultistepNavigator: FC<MultistepNavigatorProps> = ({ children }) => {
  const steps = useMemo(
    () =>
      children.map((child, index) => ({
        id: `step-${index}`,
        title: `Step ${index + 1}`,
        component: child,
        isRequired: false,
        canSkip: false,
      })),
    [children]
  );

  return (
    <BaseMultistepProvider steps={steps}>
      <StepRenderer>{children}</StepRenderer>
    </BaseMultistepProvider>
  );
};

export default MultistepNavigator;

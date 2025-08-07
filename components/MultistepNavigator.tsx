"use client";

import {
  MultistepProvider,
  useStepNavigation,
} from "@/app/contexts/MultistepContext";
import { FC, ReactNode, useMemo } from "react";

/**
 * Props for the MultistepNavigator component
 */
interface MultistepNavigatorProps {
  children: ReactNode[];
  [key: string]: any;
}

/**
 * Internal component that renders the current step content
 */
const StepRenderer: FC<{ children: ReactNode[] }> = ({ children }) => {
  const { currentStepIndex } = useStepNavigation();

  // Render the current step content
  const currentStepContent = children[currentStepIndex] || null;

  return <>{currentStepContent}</>;
};

/**
 * Component that provides multistep navigation functionality to its children.
 * Converts ReactNode children into step definitions for the Enhanced context.
 */
const MultistepNavigator: FC<MultistepNavigatorProps> = ({ children }) => {
  // Convert ReactNode children to StepDefinition format
  const steps = useMemo(() => {
    return children.map((child, index) => ({
      id: `step-${index}`,
      title: `Step ${index + 1}`,
      component: child,
      isRequired: false,
      canSkip: false,
    }));
  }, [children]);

  return (
    <MultistepProvider steps={steps}>
      <StepRenderer>{children}</StepRenderer>
    </MultistepProvider>
  );
};
export default MultistepNavigator;

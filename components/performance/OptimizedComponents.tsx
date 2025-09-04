import React, { memo, Profiler } from "react";

// Example optimizations for CreateEventForm:
export const OptimizedErrorMessage = memo(function OptimizedErrorMessage({
  message,
}: {
  message: string;
}) {
  return <div>{message}</div>;
});

export const OptimizedFormSection = memo(function OptimizedFormSection({
  errors,
  onClearErrors,
  children,
}: {
  errors: string[];
  onClearErrors: () => void;
  children: React.ReactNode;
}) {
  const hasErrors = errors.length > 0;

  return (
    <div>
      {hasErrors && <OptimizedErrorMessage message={errors.join("; ")} />}
      {children}
    </div>
  );
});

// Component Performance Profiler
export const ProfiledComponent = ({
  children,
  id,
  onRender,
}: {
  children: React.ReactNode;
  id: string;
  onRender?: (id: string, phase: string, actualDuration: number) => void;
}) => {
  return (
    <Profiler
      id={id}
      onRender={(id, phase, actualDuration) => {
        if (actualDuration > 16) {
          // Slower than 60fps
          console.warn(`Slow render detected: ${id} took ${actualDuration}ms`);
        }
        onRender?.(id, phase, actualDuration);
      }}
    >
      {children}
    </Profiler>
  );
};

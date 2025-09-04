import { memo, useMemo, useCallback, useContext, Profiler } from "react";
import React from "react";

/**
 * React Performance Optimization Utilities
 *
 * Performance Issues Found:
 * 1. CreateEventForm: Heavy component without memoization (363 lines)
 * 2. Missing React.memo for stable components
 * 3. Complex state updates triggering unnecessary re-renders
 * 4. Multiple useCallback/useMemo dependencies not optimized
 */

// Component Memoization Wrapper
export const withPerformance = <T extends object>(
  Component: React.ComponentType<T>,
  propsAreEqual?: (prevProps: T, nextProps: T) => boolean
) => {
  const MemoizedComponent = memo(Component, propsAreEqual);
  MemoizedComponent.displayName = `withPerformance(${
    Component.displayName || Component.name
  })`;
  return MemoizedComponent;
};

// Context Selector Hook for Reducing Re-renders
export const useContextSelector = <T, K>(
  context: React.Context<T>,
  selector: (value: T) => K
) => {
  const value = useContext(context);
  return useMemo(() => selector(value), [value, selector]);
};

// Stable Reference Hook
export const useStableCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  return useCallback(callback, deps);
};

// Memoized Props Helper
export const useMemoizedProps = <T extends Record<string, any>>(
  props: T,
  keys: (keyof T)[]
): Partial<T> => {
  return useMemo(
    () => {
      const memoizedProps: Partial<T> = {};
      keys.forEach((key) => {
        memoizedProps[key] = props[key];
      });
      return memoizedProps;
    },
    keys.map((key) => props[key])
  );
};

// Performance measurement utility
export const measureComponentPerformance = (componentName: string) => {
  const startTime = performance.now();

  return {
    end: () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      if (duration > 16) {
        console.warn(
          `${componentName} render time: ${duration.toFixed(
            2
          )}ms (>16ms threshold)`
        );
      }

      return duration;
    },
  };
};

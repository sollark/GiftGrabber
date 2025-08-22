/**
 * ErrorBoundary.tsx
 *
 * Purpose: React error boundary components for graceful error handling and recovery
 *
 * Main Responsibilities:
 * - Provides context-aware error boundaries for React component trees
 * - Implements functional error handling patterns with Result types
 * - Offers customizable fallback UI for different error scenarios
 * - Enables error reporting and logging with contextual information
 * - Supports error recovery mechanisms through state reset functionality
 *
 * Architecture Role:
 * - Critical infrastructure component for application stability
 * - Wraps context providers and complex components to prevent cascading failures
 * - Integrates with functional programming error handling patterns
 * - Provides user-friendly error messages and recovery options
 * - Enables production error monitoring and debugging capabilities
 */

"use client";

/**
 * ErrorBoundary component for graceful error handling in React contexts
 * Provides fallback UI and error reporting for context initialization failures
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import { failure, Result } from "@/utils/fp";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  contextName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Context-specific error boundary with functional error handling integration
 *
 * @extends Component<Props, State> React class component for error boundary lifecycle
 *
 * Architecture Role:
 * - Catches JavaScript errors in context provider trees
 * - Provides context-specific error messages and recovery options
 * - Integrates with functional programming error patterns
 * - Enables graceful degradation of context-dependent features
 */
export class ContextErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * React lifecycle method for deriving error state from caught errors
   *
   * @param error - The error that was caught by the boundary
   * @returns State object with error flag and error details
   *
   * @sideEffects Updates component state to trigger error UI rendering
   * @performance O(1) - simple state transformation
   * @notes Static method called by React error boundary lifecycle
   */
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  /**
   * React lifecycle method for handling caught errors with logging and reporting
   *
   * @param error - The error that was caught
   * @param errorInfo - React error info with component stack trace
   *
   * @sideEffects
   * - Logs error to console with context information
   * - Calls optional onError callback for custom error handling
   *
   * @performance Minimal impact - error logging only occurs during error scenarios
   * @notes Provides integration point for error reporting services
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, contextName } = this.props;

    // Log error with context information
    console.error(`Error in ${contextName || "Context"}:`, error, errorInfo);

    // Call optional error handler
    if (onError) {
      onError(error, errorInfo);
    }
  }

  /**
   * Renders error UI or children based on error state
   *
   * @returns ReactNode with either error fallback UI or normal children
   *
   * @sideEffects None - pure render method
   * @performance Conditional rendering based on error state
   * @notes Provides user-friendly error recovery interface with "Try Again" functionality
   */
  render() {
    if (this.state.hasError) {
      const { fallback, contextName } = this.props;

      if (fallback) {
        return fallback;
      }

      return (
        <div className="context-error-boundary">
          <h2>Context Error</h2>
          <p>Something went wrong in {contextName || "the context"}.</p>
          <details style={{ whiteSpace: "pre-wrap" }}>
            <summary>Error Details</summary>
            {this.state.error?.message}
            <br />
            {this.state.error?.stack}
          </details>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap context providers with error boundaries
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  contextName: string,
  fallback?: ReactNode
): React.ComponentType<P> {
  return function WrappedComponent(props: P) {
    return (
      <ContextErrorBoundary contextName={contextName} fallback={fallback}>
        <Component {...props} />
      </ContextErrorBoundary>
    );
  };
}

/**
 * Hook-based error boundary for functional components
 * Uses Result pattern for consistent error handling
 */
export function useErrorHandler(contextName: string) {
  return React.useCallback(
    (error: Error): Result<never, Error> => {
      console.error(`Error in ${contextName}:`, error);
      return failure(error);
    },
    [contextName]
  );
}

export default ContextErrorBoundary;

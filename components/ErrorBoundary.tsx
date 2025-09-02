"use client";
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

import React, { Component, ErrorInfo, ReactNode } from "react";
import { failure, Result, success } from "@/utils/fp";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  contextName?: string;
  maxRetries?: number;
  retryDelay?: number;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
  isRetrying: boolean;
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
  private retryTimeout?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
      isRetrying: false,
    };
  }

  /**
   * Cleanup retry timeout on unmount
   */
  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
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
    return {
      hasError: true,
      error,
      retryCount: 0,
      isRetrying: false,
    };
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
   * Handles retry logic with exponential backoff
   */
  private handleRetry = () => {
    const { maxRetries = 3, retryDelay = 1000 } = this.props;

    if (this.state.retryCount >= maxRetries) {
      console.warn(
        `Max retries (${maxRetries}) reached for ${
          this.props.contextName || "context"
        }`
      );
      return;
    }

    this.setState({ isRetrying: true });

    // Exponential backoff: delay * (2 ^ retryCount)
    const delay = retryDelay * Math.pow(2, this.state.retryCount);

    this.retryTimeout = setTimeout(() => {
      this.setState((prevState) => ({
        hasError: false,
        error: undefined,
        retryCount: prevState.retryCount + 1,
        isRetrying: false,
      }));
    }, delay);
  };

  /**
   * Resets error state completely
   */
  private handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      retryCount: 0,
      isRetrying: false,
    });
  };

  /**
   * Renders error UI or children based on error state with enhanced retry functionality
   *
   * @returns ReactNode with either error fallback UI or normal children
   *
   * @sideEffects None - pure render method
   * @performance Conditional rendering based on error state
   * @notes Provides user-friendly error recovery interface with retry and reset functionality
   */
  render() {
    if (this.state.hasError) {
      const { fallback, contextName, maxRetries = 3 } = this.props;
      const { retryCount, isRetrying } = this.state;

      if (fallback) {
        return fallback;
      }

      const canRetry = retryCount < maxRetries;

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
          <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
            {canRetry && (
              <button
                onClick={this.handleRetry}
                disabled={isRetrying}
                style={{
                  opacity: isRetrying ? 0.6 : 1,
                  cursor: isRetrying ? "not-allowed" : "pointer",
                }}
              >
                {isRetrying
                  ? "Retrying..."
                  : `Try Again (${retryCount}/${maxRetries})`}
              </button>
            )}
            <button onClick={this.handleReset}>Reset</button>
          </div>
          {!canRetry && (
            <p style={{ color: "#ef4444", marginTop: "0.5rem" }}>
              Maximum retry attempts reached. Please refresh the page or contact
              support.
            </p>
          )}
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
 * Enhanced hook-based error handler with retry and recovery mechanisms
 * Uses Result pattern for consistent error handling with functional composition
 */
export function useErrorHandler(contextName: string) {
  const [errorCount, setErrorCount] = React.useState(0);
  const [lastError, setLastError] = React.useState<Error | null>(null);

  const handleError = React.useCallback(
    (error: Error): Result<never, Error> => {
      setLastError(error);
      setErrorCount((prev) => prev + 1);
      console.error(
        `Error in ${contextName} (count: ${errorCount + 1}):`,
        error
      );
      return failure(error);
    },
    [contextName, errorCount]
  );

  const clearErrors = React.useCallback(() => {
    setErrorCount(0);
    setLastError(null);
  }, []);

  const getErrorSummary = React.useCallback(
    () =>
      success({
        contextName,
        errorCount,
        lastError,
        hasErrors: errorCount > 0,
      }),
    [contextName, errorCount, lastError]
  );

  return {
    handleError,
    clearErrors,
    getErrorSummary,
    errorCount,
    lastError,
  };
}

export default ContextErrorBoundary;

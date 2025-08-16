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
 * ErrorBoundary for context providers
 * Implements functional error handling patterns with Result types
 */
export class ContextErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, contextName } = this.props;

    // Log error with context information
    console.error(`Error in ${contextName || "Context"}:`, error, errorInfo);

    // Call optional error handler
    if (onError) {
      onError(error, errorInfo);
    }
  }

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

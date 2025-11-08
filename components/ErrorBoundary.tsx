import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-gray-100 dark:bg-gray-900">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Oops! Something went wrong.</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            We're sorry for the inconvenience. Please try reloading the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

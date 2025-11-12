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
  
  private handleTryAgain = () => {
    this.setState({ hasError: false });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-blue-900/50 text-gray-800 dark:text-gray-200">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Oops! Something went wrong.</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            We're sorry for the inconvenience. Please try again.
          </p>
          <button
            onClick={this.handleTryAgain}
            className="px-6 py-3 font-semibold text-white bg-blue-600/80 dark:bg-blue-500/80 backdrop-blur-xl border border-transparent rounded-xl shadow-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 ios-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

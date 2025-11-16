import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

const AlertTriangleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
);


// FIX: Removed 'public' access modifiers from class methods and properties to resolve property access error and align with common conventions.
class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false
  };

  static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen bg-base-100 text-base-content flex items-center justify-center p-4">
            <div className="w-full max-w-md text-center">
                <div className="flex justify-center mb-4">
                    <div className="p-4 bg-error/10 rounded-full">
                        <AlertTriangleIcon className="w-12 h-12 text-error" />
                    </div>
                </div>
                <h1 className="text-3xl font-bold text-text-strong">Oops! Something went wrong.</h1>
                <p className="text-base-content/80 mt-2">
                    An unexpected error occurred within the application. We've logged the issue for our team to review.
                </p>
                <div className="mt-6">
                    <button 
                        className="btn btn-primary" 
                        onClick={() => window.location.reload()}
                    >
                        Refresh Page
                    </button>
                </div>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
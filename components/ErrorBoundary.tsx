import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
  errorStack: string;
}

const AlertTriangleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
);


// FIX: Removed 'public' access modifiers from class methods and properties to resolve property access error and align with common conventions.
class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    errorMessage: '',
    errorStack: '',
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unknown error',
      errorStack: error?.stack || '',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error.message);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);
    console.error("[ErrorBoundary] Error stack:", error.stack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#060918] text-slate-200 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                <div className="bg-slate-900/80 backdrop-blur-xl border border-rose-500/30 rounded-3xl p-10 shadow-2xl shadow-rose-900/30">
                    <div className="flex justify-center mb-6">
                        <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                            <AlertTriangleIcon className="w-14 h-14 text-rose-400" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-black text-white text-center tracking-tight mb-2">Component Crashed</h1>
                    <p className="text-slate-400 text-center text-sm font-medium mb-8">
                        A rendering error occurred in this section of the application.
                    </p>

                    {/* Error Detail Panel */}
                    {this.state.errorMessage && (
                        <div className="mb-6 bg-rose-950/50 border border-rose-500/20 rounded-2xl p-5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-2">Error Message</p>
                            <p className="text-sm font-mono text-rose-200 break-all">{this.state.errorMessage}</p>
                        </div>
                    )}

                    {this.state.errorStack && (
                        <details className="mb-6 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 cursor-pointer">
                            <summary className="text-[10px] font-black uppercase tracking-widest text-slate-400 select-none">Stack Trace</summary>
                            <pre className="mt-3 text-[10px] font-mono text-slate-400 overflow-auto max-h-40 whitespace-pre-wrap break-all">{this.state.errorStack}</pre>
                        </details>
                    )}

                    <div className="flex gap-3">
                        <button
                            className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                            onClick={() => window.location.reload()}
                        >
                            Refresh App
                        </button>
                        <button
                            className="flex-1 py-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 font-black text-sm uppercase tracking-widest hover:bg-slate-700 transition-all duration-300"
                            onClick={() => this.setState({ hasError: false, errorMessage: '', errorStack: '' })}
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
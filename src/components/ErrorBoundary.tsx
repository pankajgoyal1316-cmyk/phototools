import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('PhotoTools Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-app p-8">
          <div className="text-center max-w-md">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h1 className="text-2xl font-bold text-app mb-2">Something went wrong</h1>
            <p className="text-muted mb-6">
              We encountered an unexpected error. Your data is safe — all processing happens in your browser.
            </p>
            <div className="flex flex-col gap-3 items-center">
              <button
                className="btn-primary"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                }}
              >
                Try again
              </button>
              <a href="/" className="text-sm text-muted hover:text-primary transition-colors">
                Go to Home
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

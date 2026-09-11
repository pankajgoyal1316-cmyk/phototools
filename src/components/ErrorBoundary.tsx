import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('PhotoTools Error Boundary:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-app p-8">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-app mb-2">Something went wrong</h1>
            <p className="text-muted mb-6">
              We encountered an unexpected error. Your data is safe — all processing happens in your browser.
            </p>
            <div className="flex flex-col gap-3 items-center">
              <button
                className="btn-primary"
                onClick={() => {
                  this.setState({ hasError: false });
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

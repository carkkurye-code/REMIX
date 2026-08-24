import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  resetKey?: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public componentDidUpdate(prevProps: Props) {
    if (this.props.resetKey !== prevProps.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
          <h2 className="font-serif text-2xl font-bold text-foreground">Bir şeyler ters gitti</h2>
          <p className="mt-2 text-sm text-muted-foreground">Sayfayı yenileyerek tekrar deneyebilirsiniz.</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Tekrar Dene
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

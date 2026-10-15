import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Solar ERP runtime:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleHardReset = () => {
    if (window.confirm('This will clear local session storage and re-initialize with fresh demo data. Continue?')) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-600 mb-4">
              An unexpected application error occurred. You can reload the page or reset the local cache.
            </p>
            {this.state.error && (
              <div className="bg-slate-100 rounded-lg p-3 text-left mb-6 overflow-x-auto text-xs text-slate-700 font-mono">
                {this.state.error.toString()}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>
              <button
                onClick={this.handleHardReset}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Reset Session Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

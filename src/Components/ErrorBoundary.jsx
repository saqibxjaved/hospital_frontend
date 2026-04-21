import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    // In production you'd send this to a logging service
    console.error("[ErrorBoundary]", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, info: null });
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const message = this.state.error?.message || "An unexpected error occurred.";
    const isDev   = import.meta.env?.DEV;

    return (
      <div className="min-h-screen bg-sand-100 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-card-lg border border-rose-100 overflow-hidden">

            {/* Red top bar */}
            <div className="h-1.5 bg-gradient-to-r from-rose-400 to-rose-600" />

            <div className="p-8">
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100
                              flex items-center justify-center text-rose-500 text-2xl mb-5">
                ⚠
              </div>

              <h1 className="font-display text-2xl font-semibold text-slate-900 mb-2">
                Something went wrong
              </h1>
              <p className="text-slate-500 text-sm leading-relaxed mb-4">
                MediCore encountered an unexpected error and couldn't recover. Your data is safe —
                this is a display issue only.
              </p>

              {/* Error message */}
              <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 mb-6">
                <p className="text-xs font-mono text-rose-700 break-all">{message}</p>
              </div>

              {/* Dev-only stack trace */}
              {isDev && this.state.info?.componentStack && (
                <details className="mb-6">
                  <summary className="text-xs font-semibold text-slate-400 cursor-pointer
                                      hover:text-slate-600 transition-colors mb-2">
                    Stack trace (dev only)
                  </summary>
                  <pre className="text-xs font-mono text-slate-500 bg-slate-50 rounded-xl p-3
                                  overflow-x-auto whitespace-pre-wrap border border-slate-100">
                    {this.state.info.componentStack}
                  </pre>
                </details>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => this.setState({ hasError: false, error: null, info: null })}
                  className="btn-outline flex-1 justify-center">
                  Try Again
                </button>
                <button onClick={this.handleReset} className="btn-primary flex-1 justify-center">
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-300 font-mono mt-5">
            MediCore HMS · If this keeps happening, contact your system administrator.
          </p>
        </div>
      </div>
    );
  }
}

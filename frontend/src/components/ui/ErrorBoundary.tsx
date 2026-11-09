import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  resetKey?: string;
}

interface ErrorBoundaryState {
  failed: boolean;
  resetKey?: string;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { failed: false, resetKey: this.props.resetKey };

  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    return { failed: true };
  }

  static getDerivedStateFromProps(
    props: ErrorBoundaryProps,
    state: ErrorBoundaryState,
  ): ErrorBoundaryState | null {
    return props.resetKey === state.resetKey
      ? null
      : { failed: false, resetKey: props.resetKey };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="notice notice--error" role="alert">
          <h2>Something went wrong</h2>
          <p>This page failed to display. Reload it or go back to the site.</p>
          <div className="form__actions">
            <button
              type="button"
              className="button"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
            <a className="button button--ghost" href="/">
              Home
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { failed: boolean };

/** Prevent a Creative rendering regression from blanking the entire application. */
export class CreativeErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Keep the technical failure in the browser console, not in customer-facing UI.
    console.error('Creative dashboard render failed:', error, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return <section className="creative-page" aria-label="Creative error">
        <div className="creative-error" role="alert">
          <h2>Creative dashboard could not render</h2>
          <p>The page encountered a rendering error. Reload the dashboard or check the browser console for details.</p>
          <button type="button" onClick={() => window.location.reload()}>Reload Creative</button>
        </div>
      </section>;
    }
    return this.props.children;
  }
}

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';
import { Button } from '../design-system/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-app)',
            padding: '2rem',
            color: 'var(--text-main)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              width: '100%',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--state-retracted-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '2rem',
              boxShadow: 'var(--shadow-lg)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '3.5rem',
                height: '3.5rem',
                borderRadius: '50%',
                backgroundColor: 'var(--state-retracted-bg)',
                color: 'var(--state-retracted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto',
              }}
            >
              <AlertOctagon size={28} />
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Portal Runtime Interruption
            </h2>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              A client-side exception occurred while rendering the customer portal. Your active session tokens and buffered events remain preserved in local storage.
            </p>

            {this.state.error && (
              <pre
                style={{
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  padding: '0.875rem',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--state-retracted)',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  textAlign: 'left',
                  overflowX: 'auto',
                  marginBottom: '1.5rem',
                  maxHeight: '120px',
                }}
              >
                {this.state.error.message}
              </pre>
            )}

            <Button
              variant="primary"
              leftIcon={<RotateCcw size={16} />}
              onClick={this.handleReset}
              style={{ width: '100%' }}
            >
              Reload Customer Portal
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

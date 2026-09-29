import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, GitMerge } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'binding';
  title: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 4500 }: Omit<ToastMessage, 'id'>) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newToast: ToastMessage = { id, type, title, message, duration };

      setToasts((prev) => [newToast, ...prev].slice(0, 4));

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}

      {/* Floating Toast Notification Container */}
      <div
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          maxWidth: '400px',
          width: 'calc(100vw - 3rem)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => {
          const isBinding = toast.type === 'binding';
          const isSuccess = toast.type === 'success';
          const isWarning = toast.type === 'warning';
          const isError = toast.type === 'error';

          const borderColor = isBinding
            ? 'var(--state-resolved-border)'
            : isSuccess
            ? 'var(--state-resolved-border)'
            : isWarning
            ? 'var(--state-orphan-border)'
            : isError
            ? 'var(--state-retracted-border)'
            : 'var(--color-primary)';

          const bgColor = isBinding
            ? 'rgba(16, 185, 129, 0.95)'
            : isSuccess
            ? 'rgba(15, 23, 42, 0.95)'
            : isWarning
            ? 'rgba(15, 23, 42, 0.95)'
            : 'rgba(15, 23, 42, 0.95)';

          return (
            <div
              key={toast.id}
              style={{
                backgroundColor: bgColor,
                border: `1px solid ${borderColor}`,
                borderRadius: 'var(--radius-lg)',
                padding: '0.875rem 1rem',
                boxShadow: 'var(--shadow-lg)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                color: '#fff',
                animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div style={{ marginTop: '2px', flexShrink: 0 }}>
                {isBinding ? (
                  <GitMerge size={18} color="#fff" />
                ) : isSuccess ? (
                  <CheckCircle2 size={18} color="var(--state-resolved)" />
                ) : isWarning ? (
                  <AlertTriangle size={18} color="var(--state-orphan)" />
                ) : (
                  <Info size={18} color="var(--color-primary)" />
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, lineHeight: 1.2 }}>
                  {toast.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: isBinding ? '#e2e8f0' : 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                  {toast.message}
                </div>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isBinding ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.125rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

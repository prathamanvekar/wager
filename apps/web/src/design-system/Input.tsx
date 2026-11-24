import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  id,
  className = '',
  style,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', width: '100%' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: '0.8125rem',
            fontWeight: 500,
            color: 'var(--text-secondary)',
          }}
        >
          {label}
        </label>
      )}

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {leftIcon && (
          <div
            style={{
              position: 'absolute',
              left: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
              color: 'var(--text-subtle)',
            }}
          >
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            error && inputId
              ? `${inputId}-error`
              : helperText && inputId
              ? `${inputId}-helper`
              : undefined
          }
          style={{
            width: '100%',
            backgroundColor: 'var(--bg-surface)',
            border: error ? '1px solid var(--color-danger)' : '1px solid var(--border-control)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-main)',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.875rem',
            padding: '0.5625rem 0.875rem',
            paddingLeft: leftIcon ? '2.375rem' : '0.875rem',
            paddingRight: rightIcon ? '2.375rem' : '0.875rem',
            outline: 'none',
            boxShadow: 'none',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            ...style,
          }}
          className={`transition-smooth ${className}`}
          {...props}
        />

        {rightIcon && (
          <div
            style={{
              position: 'absolute',
              right: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
              color: 'var(--text-subtle)',
            }}
          >
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <p id={inputId ? `${inputId}-error` : undefined} style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '0.125rem' }}>
          {error}
        </p>
      ) : helperText ? (
        <p id={inputId ? `${inputId}-helper` : undefined} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
};


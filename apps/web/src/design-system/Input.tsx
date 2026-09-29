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
            color: '#334155',
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
              color: '#94a3b8',
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
            backgroundColor: '#ffffff',
            border: error ? '1px solid #ef4444' : '1px solid #cbd5e1',
            borderRadius: 'var(--radius-md)',
            color: '#0f172a',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.875rem',
            padding: '0.5625rem 0.875rem',
            paddingLeft: leftIcon ? '2.375rem' : '0.875rem',
            paddingRight: rightIcon ? '2.375rem' : '0.875rem',
            outline: 'none',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
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
              color: '#94a3b8',
            }}
          >
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <p id={inputId ? `${inputId}-error` : undefined} style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.125rem' }}>
          {error}
        </p>
      ) : helperText ? (
        <p id={inputId ? `${inputId}-helper` : undefined} style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
};


import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'amber' | 'blue';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  style,
  ...props
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--color-primary)', // Crisp Workflex emerald
          color: 'var(--on-primary)',
          border: '1px solid var(--color-primary-hover)',
          boxShadow: 'none',
        };
      case 'blue':
        return {
          backgroundColor: 'var(--color-primary)', // Enterprise slate/blue
          color: 'var(--on-primary)',
          border: '1px solid var(--color-primary-hover)',
          boxShadow: 'none',
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--bg-app)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-subtle)',
        };
      case 'outline':
        return {
          backgroundColor: 'var(--bg-surface)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-medium)',
          boxShadow: 'none',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--text-secondary)',
          border: '1px solid transparent',
        };
      case 'danger':
        return {
          backgroundColor: 'var(--danger-bg)',
          color: 'var(--color-danger)',
          border: '1px solid var(--danger-border)',
        };
      case 'amber':
        return {
          backgroundColor: 'var(--state-orphan-bg)',
          color: 'var(--state-orphan)',
          border: '1px solid var(--state-orphan-border)',
        };
      default:
        return {};
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case 'sm':
        return { padding: '0.375rem 0.75rem', fontSize: '0.8125rem' };
      case 'lg':
        return { padding: '0.625rem 1.25rem', fontSize: '0.9375rem' };
      case 'md':
      default:
        return { padding: '0.5rem 1rem', fontSize: '0.875rem' };
    }
  };

  return (
    <button
      disabled={disabled || isLoading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        fontWeight: 500,
        fontFamily: 'var(--font-sans)',
        borderRadius: 'var(--radius-md)',
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        opacity: disabled || isLoading ? 0.6 : 1,
        transition: 'background-color 150ms ease, border-color 150ms ease, color 150ms ease',
        outline: 'none',
        lineHeight: 1.25,
        whiteSpace: 'nowrap',
        ...getSizeStyles(),
        ...getVariantStyles(),
        ...style,
      }}
      className={`ui-button ui-button--${variant} ui-button--${size} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span
          style={{
            width: '14px',
            height: '14px',
            border: '2px solid rgba(255,255,255,0.3)',
            borderTopColor: variant === 'outline' || variant === 'ghost' ? 'var(--text-secondary)' : 'var(--bg-surface)',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
          }}
        />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};


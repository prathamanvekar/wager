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
          backgroundColor: '#059669', // Crisp Workflex emerald
          color: '#ffffff',
          border: '1px solid #047857',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        };
      case 'blue':
        return {
          backgroundColor: '#2563eb', // Enterprise slate/blue
          color: '#ffffff',
          border: '1px solid #1d4ed8',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        };
      case 'secondary':
        return {
          backgroundColor: '#f8fafc',
          color: '#334155',
          border: '1px solid #e2e8f0',
        };
      case 'outline':
        return {
          backgroundColor: '#ffffff',
          color: '#334155',
          border: '1px solid #cbd5e1',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: '#475569',
          border: '1px solid transparent',
        };
      case 'danger':
        return {
          backgroundColor: '#fef2f2',
          color: '#dc2626',
          border: '1px solid #fecaca',
        };
      case 'amber':
        return {
          backgroundColor: '#fffbeb',
          color: '#b45309',
          border: '1px solid #fde68a',
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
        transition: 'all 0.15s ease-in-out',
        outline: 'none',
        lineHeight: 1.25,
        whiteSpace: 'nowrap',
        ...getSizeStyles(),
        ...getVariantStyles(),
        ...style,
      }}
      className={`transition-smooth ${className}`}
      {...props}
    >
      {isLoading ? (
        <span
          style={{
            width: '14px',
            height: '14px',
            border: '2px solid rgba(255,255,255,0.3)',
            borderTopColor: variant === 'outline' || variant === 'ghost' ? '#334155' : '#ffffff',
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


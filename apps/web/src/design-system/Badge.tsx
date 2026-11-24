import React from 'react';
import type { IdentityState, ChannelType } from '../types/protocol';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'primary' | 'orphan' | 'provisional' | 'resolved' | 'late' | 'retracted' | 'channel' | 'neutral';
  channel?: ChannelType;
  identityState?: IdentityState;
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  minimal?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  channel,
  identityState,
  size = 'md',
  dot = true,
  minimal = false,
  className = '',
  style,
}) => {
  // Determine effective variant if identityState or channel is provided
  let effectiveVariant = variant;
  if (identityState) {
    effectiveVariant = identityState;
  } else if (channel) {
    effectiveVariant = 'channel';
  }

  const getVariantStyles = (): { bg: string; border: string; color: string; dotColor: string } => {
    switch (effectiveVariant) {
      case 'orphan':
        return {
          bg: 'var(--state-orphan-bg)',
          border: 'var(--state-orphan-border)',
          color: 'var(--state-orphan)',
          dotColor: 'var(--state-orphan-dot)',
        };
      case 'provisional':
        return {
          bg: 'var(--color-primary-light)',
          border: 'var(--color-primary-border)',
          color: 'var(--color-primary-hover)',
          dotColor: 'var(--state-provisional-dot)',
        };
      case 'resolved':
        return {
          bg: 'var(--color-primary-light)',
          border: 'var(--color-primary-border)',
          color: 'var(--color-primary-hover)',
          dotColor: 'var(--state-resolved-dot)',
        };
      case 'late':
        return {
          bg: 'var(--state-late-bg)',
          border: 'var(--state-late-border)',
          color: 'var(--state-late)',
          dotColor: 'var(--state-late-dot)',
        };
      case 'retracted':
        return {
          bg: 'var(--state-retracted-bg)',
          border: 'var(--state-retracted-border)',
          color: 'var(--state-retracted)',
          dotColor: 'var(--state-retracted-dot)',
        };
      case 'primary':
        return {
          bg: 'var(--color-primary-light)',
          border: 'var(--color-primary-border)',
          color: 'var(--color-primary-hover)',
          dotColor: 'var(--color-primary)',
        };
      case 'channel':
        return {
          bg:
            channel === 'web'
              ? 'var(--channel-web-bg)'
              : channel === 'mobile'
              ? 'var(--state-late-bg)'
              : channel === 'call'
              ? 'var(--channel-call-bg)'
              : 'var(--channel-branch-bg)',
          border:
            channel === 'web'
              ? 'var(--channel-web-border)'
              : channel === 'mobile'
              ? 'var(--state-late-border)'
              : channel === 'call'
              ? 'var(--channel-call-border)'
              : 'var(--channel-branch-border)',
          color:
            channel === 'web'
              ? 'var(--channel-web)'
              : channel === 'mobile'
              ? 'var(--state-late)'
              : channel === 'call'
              ? 'var(--channel-call)'
              : 'var(--channel-branch)',
          dotColor:
            channel === 'web'
              ? 'var(--channel-web)'
              : channel === 'mobile'
              ? 'var(--channel-mobile)'
              : channel === 'call'
              ? 'var(--channel-call)'
              : 'var(--channel-branch)',
        };
      case 'neutral':
      default:
        return {
          bg: 'var(--bg-app)',
          border: 'var(--border-subtle)',
          color: 'var(--text-secondary)',
          dotColor: 'var(--text-subtle)',
        };
    }
  };

  const styles = getVariantStyles();

  const formatText = (text: string): string => {
    // Convert snake_case or all-caps to friendly Title Case
    return text
      .split(/[_\s]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const displayText =
    children ||
    (identityState ? formatText(identityState) : channel ? formatText(channel) : '');

  const paddingStyle =
    size === 'sm'
      ? '0.125rem 0.5rem'
      : size === 'lg'
      ? '0.375rem 0.875rem'
      : '0.2rem 0.625rem';

  const fontSizeStyle = size === 'sm' ? '0.75rem' : size === 'lg' ? '0.875rem' : '0.8125rem';

  if (minimal) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          fontSize: fontSizeStyle,
          fontWeight: 500,
          color: styles.color,
          letterSpacing: '0.01em',
          ...style,
        }}
      >
        <span
          style={{
            width: size === 'sm' ? '5px' : '6px',
            height: size === 'sm' ? '5px' : '6px',
            borderRadius: '9999px',
            backgroundColor: styles.dotColor,
            flexShrink: 0,
          }}
        />
        <span>{displayText}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${className}`}
      style={{
        backgroundColor: styles.bg,
        border: `1px solid ${styles.border}`,
        color: styles.color,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: paddingStyle,
        fontSize: fontSizeStyle,
        fontWeight: 500,
        borderRadius: '9999px',
        lineHeight: 1.25,
        letterSpacing: '0.01em',
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: size === 'sm' ? '5px' : '6px',
            height: size === 'sm' ? '5px' : '6px',
            borderRadius: '50%',
            backgroundColor: styles.dotColor,
            flexShrink: 0,
          }}
        />
      )}
      <span>{displayText}</span>
    </span>
  );
};

export interface MicroIndicatorProps {
  label: React.ReactNode;
  dotColor?: string;
  variant?: 'resolved' | 'orphan' | 'provisional' | 'neutral' | 'live' | 'error';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  style?: React.CSSProperties;
}

export const MicroIndicator: React.FC<MicroIndicatorProps> = ({
  label,
  dotColor,
  variant = 'neutral',
  size = 'sm',
  className = '',
  style,
}) => {
  const getDotColor = (): string => {
    if (dotColor) return dotColor;
    switch (variant) {
      case 'resolved':
      case 'live':
        return 'var(--state-resolved-dot)';
      case 'orphan':
        return 'var(--state-orphan-dot)';
      case 'provisional':
        return 'var(--state-provisional-dot)';
      case 'error':
        return 'var(--color-danger)';
      case 'neutral':
      default:
        return 'var(--text-subtle)';
    }
  };

  const dotSize = size === 'xs' ? '5px' : size === 'sm' ? '6px' : '7px';
  const fontSize = size === 'xs' ? '0.6875rem' : size === 'sm' ? '0.75rem' : '0.8125rem';

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        fontSize,
        fontWeight: 500,
        color: 'var(--text-secondary)',
        letterSpacing: '0.01em',
        ...style,
      }}
    >
      <span
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: '9999px',
          backgroundColor: getDotColor(),
          flexShrink: 0,
        }}
      />
      <span>{label}</span>
    </span>
  );
};


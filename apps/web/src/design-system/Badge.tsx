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
          bg: '#fffbeb',
          border: '#fde68a',
          color: '#b45309',
          dotColor: '#f59e0b',
        };
      case 'provisional':
        return {
          bg: '#eff6ff',
          border: '#bfdbfe',
          color: '#1d4ed8',
          dotColor: '#3b82f6',
        };
      case 'resolved':
        return {
          bg: '#ecfdf5',
          border: '#a7f3d0',
          color: '#047857',
          dotColor: '#10b981',
        };
      case 'late':
        return {
          bg: '#f5f3ff',
          border: '#ddd6fe',
          color: '#6d28d9',
          dotColor: '#8b5cf6',
        };
      case 'retracted':
        return {
          bg: '#fff1f2',
          border: '#fecdd3',
          color: '#be123c',
          dotColor: '#f43f5e',
        };
      case 'primary':
        return {
          bg: '#eff6ff',
          border: '#bfdbfe',
          color: '#1d4ed8',
          dotColor: '#2563eb',
        };
      case 'channel':
        return {
          bg:
            channel === 'web'
              ? '#f0f9ff'
              : channel === 'mobile'
              ? '#f5f3ff'
              : channel === 'call'
              ? '#fff7ed'
              : '#f0fdfa',
          border:
            channel === 'web'
              ? '#bae6fd'
              : channel === 'mobile'
              ? '#ddd6fe'
              : channel === 'call'
              ? '#fed7aa'
              : '#99f6e4',
          color:
            channel === 'web'
              ? '#0369a1'
              : channel === 'mobile'
              ? '#6d28d9'
              : channel === 'call'
              ? '#c2410c'
              : '#0f766e',
          dotColor:
            channel === 'web'
              ? '#0284c7'
              : channel === 'mobile'
              ? '#7c3aed'
              : channel === 'call'
              ? '#ea580c'
              : '#0d9488',
        };
      case 'neutral':
      default:
        return {
          bg: '#f8fafc',
          border: '#e2e8f0',
          color: '#475569',
          dotColor: '#94a3b8',
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
        return '#10b981';
      case 'orphan':
        return '#f59e0b';
      case 'provisional':
        return '#3b82f6';
      case 'error':
        return '#ef4444';
      case 'neutral':
      default:
        return '#94a3b8';
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
        color: '#475569',
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


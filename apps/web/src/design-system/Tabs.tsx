import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'underline' | 'pill';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  className = '',
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: variant === 'pill' ? '0.375rem' : '1.75rem',
        borderBottom: variant === 'underline' ? '1px solid var(--border-subtle)' : 'none',
        backgroundColor: variant === 'pill' ? 'var(--bg-surface-hover)' : 'transparent',
        padding: variant === 'pill' ? '0.25rem' : '0',
        borderRadius: variant === 'pill' ? 'var(--radius-lg)' : '0',
      }}
      className={`ui-tabs ui-tabs--${variant} ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            aria-pressed={isActive}
            onClick={() => onChange(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: variant === 'pill' ? '0.375rem 0.875rem' : '0.625rem 0.125rem',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
              backgroundColor:
                variant === 'pill' && isActive ? 'var(--bg-surface)' : 'transparent',
              boxShadow: variant === 'pill' && isActive ? '0 1px 2px 0 rgba(0,0,0,0.05)' : 'none',
              borderRadius: variant === 'pill' ? 'var(--radius-md)' : '0',
              border: 'none',
              borderBottom:
                variant === 'underline'
                  ? isActive
                    ? '2px solid var(--color-primary)' // Workflex green or brand accent
                    : '2px solid transparent'
                  : 'none',
              cursor: 'pointer',
              transition: 'background-color 150ms ease, border-color 150ms ease, color 150ms ease',
              outline: 'none',
              marginBottom: variant === 'underline' ? '-1px' : '0',
            }}
          >
            {tab.icon && (
              <span style={{ color: isActive ? 'var(--color-primary)' : 'var(--text-subtle)' }}>
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {tab.badge}
          </button>
        );
      })}
    </div>
  );
};


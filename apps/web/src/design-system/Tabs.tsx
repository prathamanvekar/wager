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
        borderBottom: variant === 'underline' ? '1px solid #e2e8f0' : 'none',
        backgroundColor: variant === 'pill' ? '#f1f5f9' : 'transparent',
        padding: variant === 'pill' ? '0.25rem' : '0',
        borderRadius: variant === 'pill' ? 'var(--radius-lg)' : '0',
      }}
      className={className}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: variant === 'pill' ? '0.375rem 0.875rem' : '0.625rem 0.125rem',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#0f172a' : '#64748b',
              backgroundColor:
                variant === 'pill' && isActive ? '#ffffff' : 'transparent',
              boxShadow: variant === 'pill' && isActive ? '0 1px 2px 0 rgba(0,0,0,0.05)' : 'none',
              borderRadius: variant === 'pill' ? 'var(--radius-md)' : '0',
              border: 'none',
              borderBottom:
                variant === 'underline'
                  ? isActive
                    ? '2px solid #059669' // Workflex green or brand accent
                    : '2px solid transparent'
                  : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease-in-out',
              outline: 'none',
              marginBottom: variant === 'underline' ? '-1px' : '0',
            }}
          >
            {tab.icon && (
              <span style={{ color: isActive ? '#059669' : '#94a3b8' }}>
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


import React from 'react';
import { LayoutDashboard, FileText, LifeBuoy, Layers } from 'lucide-react';
import { useEvents } from '../context/EventContext';

export type ActiveTab = 'overview' | 'cases' | 'support' | 'inspector';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const { events, orphanCount } = useEvents();

  const navItems = [
    {
      id: 'overview' as ActiveTab,
      label: 'Portal Overview',
      icon: <LayoutDashboard size={16} />,
      badge: null,
    },
    {
      id: 'cases' as ActiveTab,
      label: 'Disputes & Cases',
      icon: <FileText size={16} />,
      badge: (
        <span
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            color: 'var(--color-primary)',
            fontSize: '0.6875rem',
            padding: '0.125rem 0.375rem',
            borderRadius: 'var(--radius-full)',
            fontWeight: 600,
          }}
        >
          Active
        </span>
      ),
    },
    {
      id: 'support' as ActiveTab,
      label: 'Support Center',
      icon: <LifeBuoy size={16} />,
      badge: null,
    },
    {
      id: 'inspector' as ActiveTab,
      label: 'CJEP Event Stream',
      icon: <Layers size={16} />,
      badge: events.length > 0 ? (
        <span
          style={{
            backgroundColor: orphanCount > 0 ? 'var(--state-orphan-bg)' : 'var(--state-resolved-bg)',
            color: orphanCount > 0 ? 'var(--state-orphan)' : 'var(--state-resolved)',
            fontSize: '0.6875rem',
            padding: '0.125rem 0.375rem',
            borderRadius: 'var(--radius-full)',
            fontWeight: 600,
          }}
        >
          {events.length} {orphanCount > 0 ? `(${orphanCount} orphan)` : ''}
        </span>
      ) : null,
    },
  ];

  return (
    <nav
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'rgba(10, 16, 31, 0.5)',
      }}
    >
      <div className="app-container">
        <div style={{ display: 'flex', gap: '2rem', overflowX: 'auto' }}>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.875rem 0.25rem',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--text-main)' : 'var(--text-secondary)',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive
                    ? '2px solid var(--color-primary)'
                    : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  outline: 'none',
                }}
              >
                <span style={{ color: isActive ? 'var(--color-primary)' : 'var(--text-muted)' }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {item.badge}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

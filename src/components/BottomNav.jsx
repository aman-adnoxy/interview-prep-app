import React from 'react';
import { Home, Map, TrendingUp } from 'lucide-react';
import { sound } from '../services/sound';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'curriculum', label: 'Curriculum', icon: Map },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
];

export default function BottomNav({ currentView, onViewChange }) {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = currentView === id;
        return (
          <button
            key={id}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => {
              if (isActive) return;
              sound.playTap();
              onViewChange(id);
            }}
          >
            <Icon size={22} strokeWidth={isActive ? 2.4 : 2} />
            <span>{label}</span>
          </button>
        );
      })}
      <style>{`
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 480px;
          display: flex;
          background: #ffffff;
          border-top: 2px solid #e2e8f0;
          padding: 6px 8px calc(6px + env(safe-area-inset-bottom, 0px)) 8px;
          z-index: 40;
        }

        .bottom-nav-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          background: transparent;
          border: none;
          padding: 6px 0;
          font-family: inherit;
          font-size: 0.68rem;
          font-weight: 900;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #94a3b8;
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: color var(--transition-fast);
        }

        .bottom-nav-item.active {
          color: var(--duo-green-dark);
        }
        .bottom-nav-item.active::before {
          content: '';
          width: 26px;
          height: 3px;
          border-radius: 3px;
          background: var(--duo-green);
          margin-top: 2px;
        }
        .bottom-nav-item.active::before {
          margin-top: 0;
          order: -1;
        }
      `}</style>
    </nav>
  );
}

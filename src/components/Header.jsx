import React from 'react';
import { 
  Flame, 
  Sparkles, 
  Trophy, 
  BookOpen, 
  CheckCircle, 
  Zap, 
  Heart,
  Settings
} from 'lucide-react';
import { sound } from '../services/sound';

export default function Header({ activeTab, onTabChange, completedCount = 0, onOpenSettings }) {
  return (
    <header className="app-header">
      <div className="header-top">
        <div className="brand">
          <div className="brand-logo">
            <span role="img" aria-label="owl" className="brand-mascot">🦉</span>
          </div>
          <div>
            <h1 className="brand-title">InterviewPrep</h1>
            <span className="brand-sub">DAILY HABIT</span>
          </div>
        </div>

        <div className="header-stats">
          {/* Flame streak */}
          <div className="stat-pill flame" title="3 Day Streak">
            <Flame size={17} fill="#f59e0b" className="stat-icon flame" />
            <span className="stat-val">3</span>
          </div>

          {/* Mastery points */}
          <div className="stat-pill gem" title="Mastered Sections">
            <Trophy size={15} className="stat-icon gem" />
            <span className="stat-val">{completedCount}</span>
          </div>

          {/* Settings button */}
          <button 
            className="btn-header-settings" 
            title="Settings & Storage"
            onClick={() => { sound.playTap(); onOpenSettings(); }}
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      <nav className="header-tabs">
        <button
          className={`tab-btn ${activeTab === 'assignment' ? 'active' : ''}`}
          onClick={() => { sound.playTap(); onTabChange('assignment'); }}
        >
          <BookOpen size={18} />
          <span>TODAY'S LESSON</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'curriculum' ? 'active' : ''}`}
          onClick={() => { sound.playTap(); onTabChange('curriculum'); }}
        >
          <CheckCircle size={18} />
          <span>CURRICULUM</span>
        </button>
      </nav>

      <style>{`
        .app-header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: #ffffff;
          border-bottom: 2px solid #e2e8f0;
          padding: 14px 20px 0 20px;
        }

        .header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .brand-logo {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: var(--duo-green-bg);
          border: 2px solid #a7f3d0;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 0 #a7f3d0;
        }

        .brand-mascot {
          font-size: 1.5rem;
        }

        .brand-title {
          font-size: 1.2rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          color: #1e293b;
          line-height: 1.15;
        }

        .brand-sub {
          font-size: 0.65rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: var(--duo-green-dark);
        }

        .header-stats {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .stat-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 10px;
          border-radius: var(--radius-full);
          font-size: 0.85rem;
          font-weight: 900;
        }

        .stat-pill.flame {
          background: #fffbeb;
          color: #d97706;
          border: 1.5px solid #fde68a;
        }
        .stat-icon.flame { color: #f59e0b; }

        .stat-pill.gem {
          background: #f5f3ff;
          color: #7c3aed;
          border: 1.5px solid #ddd6fe;
        }
        .stat-icon.gem { color: #8b5cf6; }

        .btn-header-settings {
          background: #f1f5f9;
          border: 1.5px solid #e2e8f0;
          border-radius: var(--radius-sm);
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          cursor: pointer;
          transition: all 0.12s ease;
        }
        .btn-header-settings:hover {
          color: #1e293b;
          border-color: #cbd5e1;
          transform: translateY(-1px);
        }

        .header-tabs {
          display: flex;
          gap: 12px;
          border-top: 1px solid #f1f5f9;
        }

        .tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 0.85rem;
          font-weight: 900;
          letter-spacing: 0.05em;
          padding: 12px 0 14px 0;
          cursor: pointer;
          position: relative;
          transition: all var(--transition-fast);
        }

        .tab-btn.active {
          color: var(--duo-green-dark);
        }

        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 10%;
          right: 10%;
          height: 3px;
          background: var(--duo-green);
          border-radius: 3px 3px 0 0;
        }
      `}</style>
    </header>
  );
}

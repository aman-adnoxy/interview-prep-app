import React, { useState } from 'react';
import { 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  X, 
  Smartphone, 
  Trash2,
  Sparkles
} from 'lucide-react';
import { getPreferences, savePreferences } from '../services/storage';
import { sound } from '../services/sound';

export default function SettingsModal({ onClose, onResetProgress }) {
  const [prefs, setPrefs] = useState(getPreferences());
  const [confirmReset, setConfirmReset] = useState(false);

  const toggleSound = () => {
    const updated = { ...prefs, sound: !prefs.sound };
    setPrefs(updated);
    savePreferences(updated);
    sound.setEnabled(updated.sound);
    if (updated.sound) sound.playTap();
  };

  const handleClearData = async () => {
    sound.playTap();
    await onResetProgress();
    setConfirmReset(false);
    onClose();
  };

  return (
    <div className="settings-modal-overlay animate-slide-up">
      <div className="settings-modal-box">
        {/* Header */}
        <div className="settings-modal-header">
          <div className="header-title-row">
            <Sparkles size={20} className="header-icon" />
            <h2 className="settings-title">Preferences & Settings</h2>
          </div>
          <button className="btn-close-settings" onClick={() => { sound.playTap(); onClose(); }}>
            <X size={20} />
          </button>
        </div>

        <div className="settings-body">
          {/* Audio section */}
          <div className="settings-group">
            <h4 className="group-label">AUDIO & HAPTICS</h4>
            <div className="setting-row" onClick={toggleSound}>
              <div className="setting-info">
                <div className="setting-icon-cube green">
                  {prefs.sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </div>
                <div>
                  <div className="setting-name">Duolingo Sound Effects</div>
                  <div className="setting-desc">Tactile clicks, correct chimes, and victory fanfare</div>
                </div>
              </div>
              <div className={`switch-toggle ${prefs.sound ? 'on' : 'off'}`}>
                <div className="switch-handle" />
              </div>
            </div>
          </div>

          {/* App Info section */}
          <div className="settings-group">
            <h4 className="group-label">APPLICATION & STORAGE</h4>
            <div className="setting-row info-only">
              <div className="setting-info">
                <div className="setting-icon-cube blue">
                  <Smartphone size={20} />
                </div>
                <div>
                  <div className="setting-name">Progress Storage</div>
                  <div className="setting-desc">100% Client-Side Local IndexedDB</div>
                </div>
              </div>
              <span className="badge badge-beginner">PWA Ready</span>
            </div>

            <div className="setting-row info-only">
              <div className="setting-info">
                <div className="setting-icon-cube yellow">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div className="setting-name">Timezone Cadence</div>
                  <div className="setting-desc">Asia/Kolkata (IST) Daily Cycle</div>
                </div>
              </div>
              <span className="info-tag">IST</span>
            </div>
          </div>

          {/* Data Reset section */}
          <div className="settings-group">
            <h4 className="group-label">DANGER ZONE</h4>
            {!confirmReset ? (
              <button 
                className="btn-danger-action"
                onClick={() => { sound.playTap(); setConfirmReset(true); }}
              >
                <Trash2 size={16} />
                <span>Reset Learner Progress</span>
              </button>
            ) : (
              <div className="confirm-reset-box">
                <p>Are you sure? This will clear all quiz attempts and marked section completions.</p>
                <div className="confirm-btn-row">
                  <button className="btn btn-secondary sm" onClick={() => setConfirmReset(false)}>
                    Cancel
                  </button>
                  <button className="btn-danger-confirm" onClick={handleClearData}>
                    Yes, Reset Progress
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="settings-footer">
          <span>InterviewPrep v1.0.0 • Mobile First Technical Learning</span>
        </div>
      </div>

      <style>{`
        .settings-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          z-index: 100;
          display: flex;
          justify-content: center;
          align-items: flex-end;
        }

        .settings-modal-box {
          width: 100%;
          max-width: 480px;
          background: #f7f9fa;
          border-radius: 28px 28px 0 0;
          border-top: 2px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.2);
          overflow: hidden;
          max-height: 85vh;
        }

        .settings-modal-header {
          padding: 18px 20px;
          background: #ffffff;
          border-bottom: 2px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .header-icon {
          color: var(--duo-blue-dark);
        }

        .settings-title {
          font-size: 1.2rem;
          font-weight: 900;
          color: #1e293b;
        }

        .btn-close-settings {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: var(--radius-sm);
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #475569;
        }

        .settings-body {
          padding: 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .settings-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .group-label {
          font-size: 0.72rem;
          font-weight: 900;
          color: #64748b;
          letter-spacing: 0.08em;
        }

        .setting-row {
          background: #ffffff;
          border: 2px solid #e2e8f0;
          border-radius: var(--radius-md);
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          box-shadow: 0 3px 0 #e2e8f0;
          transition: all 0.12s ease;
        }
        .setting-row:hover:not(.info-only) {
          border-color: #cbd5e1;
          transform: translateY(-1px);
        }

        .setting-row.info-only {
          cursor: default;
        }

        .setting-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .setting-icon-cube {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .setting-icon-cube.green { background: #ecfdf5; color: var(--duo-green-dark); }
        .setting-icon-cube.blue { background: #eff6ff; color: var(--duo-blue-dark); }
        .setting-icon-cube.yellow { background: #fefce8; color: #b45309; }

        .setting-name {
          font-size: 0.95rem;
          font-weight: 800;
          color: #1e293b;
        }

        .setting-desc {
          font-size: 0.78rem;
          color: #64748b;
        }

        .switch-toggle {
          width: 48px;
          height: 28px;
          border-radius: var(--radius-full);
          padding: 3px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
        }
        .switch-toggle.on {
          background: var(--duo-green);
          justify-content: flex-end;
        }
        .switch-toggle.off {
          background: #cbd5e1;
          justify-content: flex-start;
        }

        .switch-handle {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .info-tag {
          font-size: 0.72rem;
          font-weight: 800;
          color: #64748b;
          background: #f1f5f9;
          padding: 4px 10px;
          border-radius: var(--radius-full);
        }

        .btn-danger-action {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #fff1f2;
          border: 2px solid #fecaca;
          color: #e11d48;
          font-weight: 800;
          font-size: 0.88rem;
          padding: 12px;
          border-radius: var(--radius-md);
          cursor: pointer;
          box-shadow: 0 3px 0 #fecdd3;
          transition: all 0.12s ease;
        }
        .btn-danger-action:hover {
          background: #ffe4e6;
          transform: translateY(-1px);
        }

        .confirm-reset-box {
          background: #fff1f2;
          border: 2px solid #fecaca;
          border-radius: var(--radius-md);
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .confirm-reset-box p {
          font-size: 0.84rem;
          color: #9f1239;
          line-height: 1.4;
          font-weight: 600;
        }

        .confirm-btn-row {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .btn-danger-confirm {
          background: #e11d48;
          color: #ffffff;
          border: none;
          padding: 8px 14px;
          font-weight: 800;
          font-size: 0.82rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          box-shadow: 0 3px 0 #9f1239;
        }

        .settings-footer {
          padding: 14px 20px;
          background: #ffffff;
          border-top: 2px solid #e2e8f0;
          text-align: center;
          font-size: 0.75rem;
          color: #94a3b8;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}

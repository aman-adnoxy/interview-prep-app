import React, { useMemo, useState } from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import '../attempt-history.css';
import AttemptHistorySection from './AttemptHistorySection';
import { sound } from '../services/sound';
import { computeRecentAccuracy, getWeakSections } from '../services/stats';
import { findSectionInManifest } from '../services/api';

const ACCURACY_EMPTY_TEXT = 'Take a knowledge check to unlock your accuracy signal.';
const WEAK_EMPTY_TEXT = 'Nothing to revisit right now — keep the streak alive.';

/**
 * Progress tab: completed sections, recent accuracy, weak topics and the
 * full attempt-history audit trail (with section filter chips).
 */
export default function ProgressScreen({ manifest, progressMap = {}, attempts = [], onOpenSection }) {
  const [historyFilter, setHistoryFilter] = useState('all');

  const attemptsByTime = useMemo(
    () => [...attempts]
      .filter((a) => a?.timestamp)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [attempts]
  );

  const recentAccuracy = useMemo(() => computeRecentAccuracy(attempts), [attempts]);
  const weakSections = useMemo(() => getWeakSections(progressMap), [progressMap]);

  const completedSections = useMemo(() => {
    if (!manifest?.topics) return [];
    const rows = [];
    for (const topic of manifest.topics) {
      for (const section of topic.sections || []) {
        if (section.status === 'published' && progressMap[section.id]?.completed) {
          rows.push({ ...section, topicId: topic.id, topicTitle: topic.title });
        }
      }
    }
    return rows;
  }, [manifest, progressMap]);

  const resolveTitle = (sectionId) => findSectionInManifest(manifest, sectionId)?.title || null;

  const filterSectionIds = useMemo(() => {
    if (historyFilter === 'all') return null;
    if (historyFilter === 'weak') return new Set(weakSections.map((w) => w.sectionId));
    return new Set([historyFilter]);
  }, [historyFilter, weakSections]);

  const visibleAttempts = filterSectionIds
    ? attemptsByTime.filter((a) => filterSectionIds.has(a.sectionId))
    : attemptsByTime;

  const attemptedSectionIds = useMemo(
    () => [...new Set(attemptsByTime.map((a) => a.sectionId))],
    [attemptsByTime]
  );

  const chipTitle = (sectionId) => {
    const section = findSectionInManifest(manifest, sectionId);
    return section?.title || 'All sections';
  };

  return (
    <div className="progress-screen animate-slide-up">
      <div className="progress-header-block">
        <h1 className="home-title">Progress</h1>
        <p className="home-tagline">Your readiness, measured — not guessed.</p>
      </div>

      {/* Recent accuracy */}
      <div className="accuracy-card">
        <div className="accuracy-ring" style={{ '--ring-color': recentAccuracy !== null && recentAccuracy >= 75 ? 'var(--duo-green)' : 'var(--duo-yellow-dark)' }}>
          {recentAccuracy !== null ? (
            <><span className="accuracy-value">{recentAccuracy}%</span><span className="accuracy-label">RECENT ACCURACY</span><span className="accuracy-sub">last {Math.min(3, attemptsByTime.length)} attempts</span></>
          ) : (
            <><span className="accuracy-value">—</span><span className="accuracy-label">RECENT ACCURACY</span><span className="accuracy-sub">no valid attempts yet</span></>
          )}
        </div>
        <p className="accuracy-hint">
          {recentAccuracy !== null
            ? 'Averaged across your three most recent valid knowledge checks.'
            : ACCURACY_EMPTY_TEXT}
        </p>
      </div>

      {/* Weak topics */}
      <div className="home-section-header">
        <h3>Topics to revisit</h3>
      </div>
      {weakSections.length > 0 ? (
        <div className="weak-list">
          {weakSections.map(({ sectionId, pct }) => {
            const section = findSectionInManifest(manifest, sectionId);
            return (
              <button
                key={sectionId}
                className="weak-row"
                onClick={() => { sound.playTap(); onOpenSection({ id: sectionId }); }}
              >
                <RotateCcw size={16} className="weak-icon" />
                <span className="weak-row-title">{section?.title || sectionId}</span>
                <span className="weak-row-pct">{pct}%</span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="progress-empty-note">{WEAK_EMPTY_TEXT}</p>
      )}

      {/* Completed sections */}
      <div className="home-section-header">
        <h3>Completed sections</h3>
        <span className="completed-count-chip">{completedSections.length}</span>
      </div>
      {completedSections.length > 0 ? (
        <div className="completed-list">
          {completedSections.map((section) => (
            <div key={section.id} className="completed-row">
              <CheckCircle2 size={18} className="completed-icon" />
              <div className="completed-body">
                <span className="completed-title">{section.title}</span>
                <span className="completed-topic">{section.topicTitle}</span>
              </div>
              <span className="completed-meta">
                {(() => {
                  const prog = progressMap[section.id];
                  const total = prog?.totalQuestions;
                  return prog?.bestScore != null && Number.isFinite(total) && total > 0
                    ? `Best ${Math.round((prog.bestScore / total) * 100)}%`
                    : 'Mastered';
                })()}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="progress-empty-note">No sections completed yet. Your first mastery is one knowledge check away.</p>
      )}

      {/* Full attempt history */}
      <div className="home-section-header">
        <h3>Attempt history</h3>
        <span className="completed-count-chip">{visibleAttempts.length}</span>
      </div>

      {attemptedSectionIds.length > 0 && (
        <div className="history-filter-row">
          <button
            className={`filter-chip ${historyFilter === 'all' ? 'active' : ''}`}
            onClick={() => { sound.playTap(); setHistoryFilter('all'); }}
          >
            All
          </button>
          {attemptedSectionIds.map((sectionId) => (
            <button
              key={sectionId}
              className={`filter-chip ${historyFilter === sectionId ? 'active' : ''}`}
              onClick={() => { sound.playTap(); setHistoryFilter(sectionId); }}
            >
              {chipTitle(sectionId)}
            </button>
          ))}
        </div>
      )}

      <AttemptHistorySection attempts={visibleAttempts} resolveTitle={resolveTitle} />

      <style>{`
        .progress-screen { padding: 22px 16px 110px 16px; display: flex; flex-direction: column; gap: 14px; }
        .progress-header-block { margin-bottom: 2px; }

        .accuracy-card {
          background: #ffffff;
          border: 2px solid #e2e8f0;
          border-radius: var(--radius-lg);
          box-shadow: 0 4px 0 #e2e8f0;
          padding: 18px;
        }
        .accuracy-ring { display: flex; align-items: baseline; gap: 10px; }
        .accuracy-value { font-size: 2rem; font-weight: 900; color: var(--ring-color, var(--duo-green-dark)); }
        .accuracy-label { font-size: 0.66rem; font-weight: 900; color: #94a3b8; letter-spacing: 0.08em; }
        .accuracy-sub { font-size: 0.72rem; color: #cbd5e1; font-weight: 700; margin-left: auto; }
        .accuracy-hint { font-size: 0.8rem; color: #64748b; line-height: 1.45; margin-top: 8px; }

        .weak-list { display: flex; flex-direction: column; gap: 8px; }
        .weak-row {
          display: flex; align-items: center; gap: 10px;
          background: #fff1f2; border: 1px solid #fecaca;
          border-radius: var(--radius-md); padding: 10px 14px;
          cursor: pointer; font-family: inherit; width: 100%; text-align: left;
          transition: background var(--transition-fast);
        }
        .weak-row:hover { background: #ffe4e6; }
        .weak-icon { color: var(--duo-red); flex-shrink: 0; }
        .weak-row-title { flex: 1; font-size: 0.88rem; font-weight: 800; color: #1e293b; }
        .weak-row-pct { font-size: 0.78rem; font-weight: 900; color: var(--duo-red-dark); }

        .completed-list { display: flex; flex-direction: column; gap: 8px; }
        .completed-row {
          display: flex; align-items: center; gap: 12px;
          background: #ffffff; border: 2px solid #e2e8f0;
          border-radius: var(--radius-md);
          box-shadow: 0 3px 0 #e2e8f0;
          padding: 12px 14px;
        }
        .completed-icon { color: var(--duo-green-dark); flex-shrink: 0; }
        .completed-body { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .completed-title { font-size: 0.9rem; font-weight: 800; color: #1e293b; }
        .completed-topic { font-size: 0.72rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .completed-meta { font-size: 0.72rem; font-weight: 800; color: var(--duo-green-dark); flex-shrink: 0; }

        .progress-empty-note { font-size: 0.85rem; color: #94a3b8; line-height: 1.5; }

        .completed-count-chip {
          font-size: 0.7rem; font-weight: 900; color: #64748b;
          background: #f1f5f9; border: 1px solid #e2e8f0;
          padding: 2px 9px; border-radius: var(--radius-full);
        }

        .history-filter-row { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
        .history-filter-row::-webkit-scrollbar { display: none; }
        .filter-chip {
          flex-shrink: 0;
          font-family: inherit;
          font-size: 0.76rem; font-weight: 800; color: #475569;
          background: #f1f5f9; border: 1.5px solid #e2e8f0;
          padding: 6px 13px; border-radius: var(--radius-full);
          cursor: pointer; transition: all var(--transition-fast);
        }
        .filter-chip.active {
          color: #ffffff; background: var(--duo-green-dark); border-color: var(--duo-green-dark);
        }
      `}</style>
    </div>
  );
}

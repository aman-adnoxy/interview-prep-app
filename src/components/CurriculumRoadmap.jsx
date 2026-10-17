import React from 'react';
import { 
  Database, 
  Server, 
  Layers, 
  Binary, 
  Cpu, 
  Bot, 
  CheckCircle2, 
  Clock, 
  Lock, 
  ArrowRight,
  BookOpen
} from 'lucide-react';

const TRACK_ICONS = {
  databases: Database,
  backend: Server,
  'oop-api-design': Layers,
  dsa: Binary,
  'system-design': Cpu,
  'ai-engineering': Bot,
};

export default function CurriculumRoadmap({
  manifest,
  progressMap = {},
  activeSectionId,
  onSelectSection
}) {
  if (!manifest || !manifest.topics) {
    return <div className="p-4">Loading curriculum manifest...</div>;
  }

  return (
    <div className="curriculum-container animate-slide-up">
      <div className="curriculum-header">
        <h2>Curriculum Sequence</h2>
        <p>Fixed daily learning path for technical interview preparation</p>
      </div>

      <div className="topics-list">
        {manifest.topics.map((topic, topicIdx) => {
          const Icon = TRACK_ICONS[topic.id] || BookOpen;
          const sections = topic.sections || [];
          const hasSections = sections.length > 0;

          return (
            <div key={topic.id} className="topic-block">
              {/* Topic Heading */}
              <div className="topic-header glass-panel">
                <div className="topic-icon-wrap">
                  <Icon size={20} />
                </div>
                <div className="topic-info">
                  <div className="topic-order">Track 0{topicIdx + 1}</div>
                  <h3 className="topic-title">{topic.title}</h3>
                  <p className="topic-desc">{topic.description}</p>
                </div>
              </div>

              {/* Sections list */}
              {hasSections ? (
                <div className="sections-list">
                  {sections.map((sec, secIdx) => {
                    const prog = progressMap[sec.id];
                    const isCompleted = prog?.completed;
                    const isActive = activeSectionId === sec.id;

                    return (
                      <div
                        key={sec.id}
                        className={`section-row glass-panel ${isActive ? 'is-active' : ''} ${isCompleted ? 'is-completed' : ''}`}
                        onClick={() => onSelectSection(sec)}
                      >
                        <div className="status-indicator">
                          {isCompleted ? (
                            <CheckCircle2 size={22} className="check-done" />
                          ) : (
                            <div className="dot-step">{secIdx + 1}</div>
                          )}
                        </div>

                        <div className="section-meta">
                          <div className="section-top-line">
                            <span className={`badge badge-${sec.difficulty || 'beginner'}`}>
                              {sec.difficulty}
                            </span>
                            {isActive && <span className="active-pill">Today's Focus</span>}
                          </div>
                          <h4 className="section-name">{sec.title}</h4>
                          <span className="section-qcount">{sec.questionCount || 8} Questions • 1 Case Study</span>
                        </div>

                        <ArrowRight size={18} className="row-arrow" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-topic-sections glass-panel">
                  <Lock size={15} className="lock-icon" />
                  <span>Curriculum sections being published soon</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        .curriculum-container {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding-bottom: 40px;
        }

        .curriculum-header h2 {
          font-size: 1.25rem;
          margin-bottom: 4px;
        }

        .curriculum-header p {
          font-size: 0.82rem;
          color: var(--text-secondary);
        }

        .topics-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .topic-block {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .topic-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(18, 24, 36, 0.6);
        }

        .topic-icon-wrap {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-sm);
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          color: var(--accent-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .topic-info {
          flex: 1;
        }

        .topic-order {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .topic-title {
          font-size: 1.05rem;
          margin-bottom: 2px;
        }

        .topic-desc {
          font-size: 0.78rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .sections-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-left: 12px;
          border-left: 2px dashed rgba(255, 255, 255, 0.1);
          margin-left: 18px;
        }

        .section-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .section-row:hover {
          background: var(--bg-tertiary);
          border-color: rgba(99, 102, 241, 0.3);
        }

        .section-row.is-active {
          border-color: var(--accent-primary);
          background: rgba(99, 102, 241, 0.08);
        }

        .status-indicator {
          flex-shrink: 0;
        }

        .dot-step {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: var(--bg-elevated);
          border: 1px solid rgba(255, 255, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .check-done {
          color: var(--accent-emerald);
        }

        .section-meta {
          flex: 1;
        }

        .section-top-line {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .active-pill {
          font-size: 0.68rem;
          font-weight: 700;
          color: #818cf8;
          background: rgba(99, 102, 241, 0.15);
          padding: 2px 8px;
          border-radius: var(--radius-full);
        }

        .section-name {
          font-size: 0.95rem;
          line-height: 1.3;
          margin-bottom: 4px;
          color: #ffffff;
        }

        .section-qcount {
          font-size: 0.74rem;
          color: var(--text-muted);
        }

        .row-arrow {
          color: var(--text-muted);
          transition: transform var(--transition-fast);
        }

        .section-row:hover .row-arrow {
          transform: translateX(3px);
          color: var(--text-primary);
        }

        .empty-topic-sections {
          margin-left: 18px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.76rem;
          color: var(--text-muted);
          background: rgba(255, 255, 255, 0.02);
        }

        .lock-icon {
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}

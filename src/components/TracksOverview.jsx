import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Lock,
  CheckCircle2,
  Circle,
  PlayCircle,
  Map
} from 'lucide-react';
import { sound } from '../services/sound';
import { getTopicTheme } from '../topicThemes';

/**
 * Curriculum tab: one card per track. Tapping a card expands it inline to
 * show that track's module (section) list; a "PATH" chip opens the classic
 * topic learning path view.
 */
export default function TracksOverview({
  manifest,
  progressMap = {},
  onSelectTopic,
  onSelectSection,
  activeSectionId
}) {
  const [expandedTopicId, setExpandedTopicId] = useState(null);

  if (!manifest || !manifest.topics) {
    return <div className="p-6 text-center">Loading curriculum topics...</div>;
  }

  return (
    <div className="tracks-page-container animate-slide-up">
      <div className="tracks-hero">
        <h2 className="hero-title">Curriculum</h2>
        <p className="hero-sub">
          Tap a track to see its modules. Complete a knowledge check to master a section.
        </p>
      </div>

      <div className="topics-cards-list">
        {manifest.topics.map((topic, index) => {
          const style = getTopicTheme(topic.id);
          const Icon = style.icon;
          const sections = topic.sections || [];
          const published = sections.filter((s) => s.status === 'published');
          const hasContent = published.length > 0;

          const completedCount = published.filter((s) => progressMap[s.id]?.completed).length;
          const percent = hasContent
            ? Math.round((completedCount / published.length) * 100)
            : 0;
          const isExpanded = expandedTopicId === topic.id;

          const toggleExpand = () => {
            sound.playTap();
            setExpandedTopicId(isExpanded ? null : topic.id);
          };

          return (
            <div key={topic.id} className={`topic-card-outer ${!hasContent ? 'locked' : ''}`}>
              <div
                role="button"
                tabIndex={0}
                className={`topic-card ${isExpanded ? 'expanded' : ''}`}
                onClick={toggleExpand}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(); } }}
                aria-expanded={isExpanded}
                style={{ '--theme-c': style.color, '--theme-dark': style.colorDark }}
              >
                <div className="topic-icon-wrap" style={{ background: style.bg, color: style.colorDark }}>
                  <Icon size={26} />
                </div>

                <div className="topic-content">
                  <div className="topic-badge-row">
                    <span className="topic-badge" style={{ color: style.colorDark }}>{style.badge}</span>
                    <span className="topic-num">Track {index + 1}</span>
                  </div>
                  <h3 className="topic-title">{topic.title}</h3>

                  {hasContent ? (
                    <div className="progress-container">
                      <div className="track-bar">
                        <div className="track-fill" style={{ width: `${Math.max(percent, 8)}%`, background: style.color }}></div>
                      </div>
                      <span className="progress-text">{completedCount}/{published.length} Sections</span>
                    </div>
                  ) : (
                    <div className="locked-pill">
                      <Lock size={13} />
                      <span>Launching soon</span>
                    </div>
                  )}
                </div>

                <div className="topic-chevron">
                  {hasContent
                    ? (isExpanded ? <ChevronDown size={22} /> : <ChevronRight size={22} />)
                    : <Lock size={18} />}
                </div>
              </div>

              {/* Inline expandable module list */}
              {isExpanded && hasContent && (
                <div className="topic-module-list">
                  {published.map((section) => {
                    const prog = progressMap[section.id];
                    const isCompleted = Boolean(prog?.completed);
                    const isActive = activeSectionId === section.id;
                    // Published sections are always available (unlock scope is
                    // enforced by the path view's in-circle affordances).

                    return (
                      <div key={section.id} className="module-row">
                        <span className={`module-status ${isCompleted ? 'done' : isActive ? 'active' : ''}`}>
                          {isCompleted ? <CheckCircle2 size={17} /> : isActive ? <PlayCircle size={17} /> : <Circle size={17} />}
                        </span>
                        <button
                          className="module-body"
                          onClick={() => {
                            sound.playTap();
                            onSelectSection({ ...section, topicId: topic.id, topicTitle: topic.title }, 'lesson');
                          }}
                        >
                          <span className="module-title">{section.title}</span>
                          <span className="module-meta">
                            {section.questionCount ? `${section.questionCount} knowledge checks` : 'Knowledge check'}
                          </span>
                        </button>
                      </div>
                    );
                  })}

                  <button
                    className="path-cta"
                    onClick={() => { sound.playTap(); onSelectTopic(topic); }}
                  >
                    <Map size={15} />
                    <span>Open {topic.title} path</span>
                    <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        .tracks-page-container {
          padding: 20px 16px 110px 16px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .tracks-hero { margin-bottom: 4px; }

        .hero-title {
          font-size: 1.45rem;
          font-weight: 900;
          color: #1e293b;
        }

        .hero-sub {
          font-size: 0.9rem;
          color: #64748b;
          margin-top: 4px;
        }

        .topics-cards-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .topic-card-outer {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .topic-card {
          background: #ffffff;
          border: 2px solid #e2e8f0;
          border-radius: var(--radius-lg);
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 4px 0 #e2e8f0;
          cursor: pointer;
          transition: all 0.12s ease;
          position: relative;
        }

        .topic-card:hover {
          border-color: var(--theme-c);
        }

        .topic-card.locked { opacity: 0.8; }

        .topic-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 2px solid rgba(0, 0, 0, 0.05);
        }

        .topic-content { flex: 1; }

        .topic-badge-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 2px;
        }

        .topic-badge {
          font-size: 0.7rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .topic-num {
          font-size: 0.68rem;
          color: #94a3b8;
          font-weight: 800;
        }

        .topic-title {
          font-size: 1.15rem;
          font-weight: 900;
          color: #1e293b;
          line-height: 1.25;
          margin-bottom: 4px;
        }

        .progress-container {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .track-bar {
          flex: 1;
          height: 8px;
          background: #f1f5f9;
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .track-fill {
          height: 100%;
          border-radius: var(--radius-full);
        }

        .progress-text {
          font-size: 0.72rem;
          font-weight: 800;
          color: #64748b;
        }

        .locked-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.72rem;
          color: #94a3b8;
          background: #f8fafc;
          padding: 4px 10px;
          border-radius: var(--radius-full);
          border: 1px solid #e2e8f0;
        }

        .topic-chevron { color: #94a3b8; }

        .topic-module-list {
          margin: 6px 10px 10px 10px;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-top: none;
          border-radius: 0 0 var(--radius-lg) var(--radius-lg);
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: -14px;
          padding-top: 18px;
        }

        .module-row {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: var(--radius-md);
          padding: 8px 12px;
        }

        .module-status { flex-shrink: 0; color: #cbd5e1; display: flex; }
        .module-status.done { color: var(--duo-green-dark); }
        .module-status.active { color: var(--duo-blue-dark); }

        .module-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1px;
          background: transparent;
          border: none;
          padding: 0;
          text-align: left;
          cursor: pointer;
          font-family: inherit;
          min-width: 0;
        }

        .module-title {
          font-size: 0.88rem;
          font-weight: 800;
          color: #1e293b;
        }

        .module-meta {
          font-size: 0.7rem;
          font-weight: 700;
          color: #94a3b8;
        }

        .path-cta {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
          background: transparent;
          border: none;
          font-family: inherit;
          font-size: 0.78rem;
          font-weight: 900;
          color: #64748b;
          cursor: pointer;
          padding: 6px 2px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .path-cta:hover { color: #1e293b; }
        .path-cta span:last-child { margin-left: auto; }
      `}</style>
    </div>
  );
}

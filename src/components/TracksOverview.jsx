import React from 'react';
import { 
  Database, 
  Server, 
  Layers, 
  Binary, 
  Cpu, 
  Bot, 
  ChevronRight, 
  Lock
} from 'lucide-react';
import { sound } from '../services/sound';

const TOPIC_STYLES = {
  databases: {
    icon: Database,
    color: '#58cc02',
    colorDark: '#46a302',
    bg: '#ecfdf5',
    badge: 'Storage & Querying'
  },
  backend: {
    icon: Server,
    color: '#1cb0f6',
    colorDark: '#1899d6',
    bg: '#eff6ff',
    badge: 'APIs & Microservices'
  },
  'oop-api-design': {
    icon: Layers,
    color: '#af67e9',
    colorDark: '#9047cf',
    bg: '#f3e8ff',
    badge: 'OOP & Patterns'
  },
  dsa: {
    icon: Binary,
    color: '#ffc800',
    colorDark: '#e5a400',
    bg: '#fefce8',
    badge: 'Algorithms & Structures'
  },
  'system-design': {
    icon: Cpu,
    color: '#06b6d4',
    colorDark: '#0891b2',
    bg: '#ecfeff',
    badge: 'Distributed Architecture'
  },
  'ai-engineering': {
    icon: Bot,
    color: '#ff4b4b',
    colorDark: '#ea2b2b',
    bg: '#fff1f2',
    badge: 'RAG & AI Agents'
  }
};

export default function TracksOverview({
  manifest,
  progressMap = {},
  onSelectTopic
}) {
  if (!manifest || !manifest.topics) {
    return <div className="p-6 text-center">Loading curriculum topics...</div>;
  }

  return (
    <div className="tracks-page-container animate-slide-up">
      <div className="tracks-hero">
        <h2 className="hero-title">Choose a Course</h2>
        <p className="hero-sub">
          Select a domain to start its step-by-step interview curriculum.
        </p>
      </div>

      <div className="topics-cards-list">
        {manifest.topics.map((topic, index) => {
          const style = TOPIC_STYLES[topic.id] || TOPIC_STYLES.databases;
          const Icon = style.icon;
          const sections = topic.sections || [];
          const hasContent = sections.length > 0;

          const completedCount = sections.filter((s) => progressMap[s.id]?.completed).length;
          const totalCount = sections.length;
          const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

          return (
            <div
              key={topic.id}
              className={`topic-card ${!hasContent ? 'locked' : ''}`}
              onClick={() => {
                sound.playTap();
                onSelectTopic(topic);
              }}
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
                <p className="topic-desc">{topic.description}</p>

                {hasContent ? (
                  <div className="progress-container">
                    <div className="track-bar">
                      <div className="track-fill" style={{ width: `${Math.max(percent, 8)}%`, background: style.color }}></div>
                    </div>
                    <span className="progress-text">{completedCount}/{totalCount} Sections</span>
                  </div>
                ) : (
                  <div className="locked-pill">
                    <Lock size={13} />
                    <span>Launching soon</span>
                  </div>
                )}
              </div>

              <div className="topic-chevron">
                {hasContent ? <ChevronRight size={22} /> : <Lock size={18} />}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .tracks-page-container {
          padding: 20px 16px 60px 16px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .tracks-hero {
          margin-bottom: 4px;
        }

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
        }

        .topic-card:hover {
          border-color: var(--theme-c);
          transform: translateY(-2px);
          box-shadow: 0 6px 0 #e2e8f0;
        }

        .topic-card:active {
          transform: translateY(4px);
          box-shadow: 0 0 0 #e2e8f0;
        }

        .topic-card.locked {
          opacity: 0.8;
        }

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

        .topic-content {
          flex: 1;
        }

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

        .topic-desc {
          font-size: 0.84rem;
          color: #64748b;
          line-height: 1.4;
          margin-bottom: 8px;
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

        .topic-chevron {
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
}

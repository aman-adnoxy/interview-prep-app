import React from 'react';
import { 
  Database, 
  Server, 
  Layers, 
  Binary, 
  Cpu, 
  Bot, 
  ArrowLeft, 
  Check, 
  Lock, 
  Star, 
  Play, 
  Sparkles
} from 'lucide-react';
import { sound } from '../services/sound';

const TOPIC_CONFIGS = {
  databases: {
    icon: Database,
    color: '#58cc02',
    colorDark: '#46a302',
    bannerBg: '#ecfdf5',
    titleColor: '#166534'
  },
  backend: {
    icon: Server,
    color: '#1cb0f6',
    colorDark: '#1899d6',
    bannerBg: '#eff6ff',
    titleColor: '#1e40af'
  },
  'oop-api-design': {
    icon: Layers,
    color: '#af67e9',
    colorDark: '#9047cf',
    bannerBg: '#f3e8ff',
    titleColor: '#6b21a8'
  },
  dsa: {
    icon: Binary,
    color: '#ffc800',
    colorDark: '#e5a400',
    bannerBg: '#fefce8',
    titleColor: '#854d0e'
  },
  'system-design': {
    icon: Cpu,
    color: '#06b6d4',
    colorDark: '#0891b2',
    bannerBg: '#ecfeff',
    titleColor: '#155e75'
  },
  'ai-engineering': {
    icon: Bot,
    color: '#ff4b4b',
    colorDark: '#ea2b2b',
    bannerBg: '#fff1f2',
    titleColor: '#9f1239'
  }
};

export default function TopicLearningPath({
  topic,
  progressMap = {},
  onSelectSection,
  onBackToTracks
}) {
  const config = TOPIC_CONFIGS[topic?.id] || TOPIC_CONFIGS.databases;
  const Icon = config.icon;
  const sections = topic?.sections || [];

  const totalSections = sections.length;
  const completedSections = sections.filter((s) => progressMap[s.id]?.completed).length;
  const progressPercent = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;

  // Zig-zag offsets for Duolingo winding path
  const offsets = [0, 42, -36, 48, -42, 24, -24];

  return (
    <div className="duo-path-page animate-slide-up">
      {/* Unit Header Banner */}
      <header className="unit-header-box" style={{ background: config.bannerBg, borderColor: config.color }}>
        <div className="unit-top-actions">
          <button 
            className="btn-back-tracks" 
            onClick={() => { sound.playTap(); onBackToTracks(); }}
          >
            <ArrowLeft size={18} />
            <span>ALL TRACKS</span>
          </button>

          <div className="mastery-star-chip">
            <Star size={16} fill="#ffc800" color="#e5a400" />
            <span>{completedSections}/{totalSections || 1} COMPLETED</span>
          </div>
        </div>

        <div className="unit-banner-content">
          <div className="unit-icon-cube" style={{ background: config.color, boxShadow: `0 4px 0 ${config.colorDark}` }}>
            <Icon size={28} color="#ffffff" />
          </div>
          <div>
            <div className="unit-super-tag" style={{ color: config.colorDark }}>SECTION 1</div>
            <h1 className="unit-main-title" style={{ color: config.titleColor }}>{topic.title}</h1>
            <p className="unit-tagline">{topic.description}</p>
          </div>
        </div>
      </header>

      {/* Stepping Stones Course Path */}
      <div className="course-stones-track">
        {sections.length > 0 ? (
          sections.map((section, idx) => {
            const prog = progressMap[section.id];
            const isCompleted = Boolean(prog?.completed);
            const isPublished = section.status === 'published';
            const isCurrent = isPublished && !isCompleted && (idx === 0 || progressMap[sections[idx - 1]?.id]?.completed);
            const isLocked = !isPublished || (!isCompleted && !isCurrent);
            const scoreTotal = section.questionCount ?? prog?.totalQuestions;
            const xOffset = offsets[idx % offsets.length];

            return (
              <div 
                key={section.id} 
                className="stone-node-wrap"
                style={{ transform: `translateX(${xOffset}px)` }}
              >
                {/* Connecting Dotted Line */}
                {idx < sections.length - 1 && (
                  <div className="stone-connector-line" />
                )}

                <div className="node-assembly">
                  <button
                    className={`chunky-stone ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                    onClick={() => {
                      if (isLocked) return;
                      sound.playTap();
                      onSelectSection(section);
                    }}
                    disabled={isLocked}
                    title={
                      !isPublished 
                        ? `${section.title} (Upcoming)` 
                        : isLocked 
                        ? 'Complete earlier sections to unlock' 
                        : section.title
                    }
                  >
                    {isCompleted ? (
                      <Check size={32} color="#ffffff" strokeWidth={3} />
                    ) : isCurrent ? (
                      <Play size={28} color="#ffffff" fill="#ffffff" />
                    ) : (
                      <Lock size={24} color="#94a3b8" />
                    )}

                    {isCurrent && (
                      <div className="start-banner-badge">
                        <Sparkles size={12} fill="#ffffff" />
                        <span>START</span>
                      </div>
                    )}
                  </button>

                  {/* Section Label Card below stone */}
                  <div 
                    className={`stone-label-box ${isLocked ? 'locked-box' : ''}`} 
                    onClick={() => {
                      if (isLocked) return;
                      sound.playTap();
                      onSelectSection(section);
                    }}
                  >
                    <div className="label-badge-row">
                      <span className={`badge badge-${section.difficulty || 'beginner'}`}>
                        {section.difficulty}
                      </span>
                      {!isPublished ? (
                        <span className="upcoming-tag">Upcoming</span>
                      ) : isCompleted ? (
                        <span className="passed-badge">
                          {(prog?.bestScore ?? prog?.lastScore)}/{scoreTotal} Correct
                        </span>
                      ) : null}
                    </div>
                    <div className="label-title">{section.title}</div>
                    <div className="label-footer">{Number.isInteger(section.questionCount) ? `${section.questionCount} Questions • 1 Case` : 'Lesson coming soon'}</div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-topic-banner">
            <Lock size={36} color="#94a3b8" />
            <h3>Curriculum Launching Soon</h3>
            <p>New interactive sections for {topic.title} are in the content pipeline.</p>
          </div>
        )}
      </div>

      <style>{`
        .duo-path-page {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: #f7f9fa;
          padding-bottom: 90px;
        }

        .unit-header-box {
          padding: 16px 20px 20px 20px;
          border-bottom: 2px solid;
          box-shadow: 0 4px 0 rgba(0, 0, 0, 0.05);
          position: sticky;
          top: 0;
          z-index: 40;
        }

        .unit-top-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .btn-back-tracks {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          border: 2px solid #e2e8f0;
          color: #475569;
          font-weight: 800;
          font-size: 0.78rem;
          padding: 6px 12px;
          border-radius: var(--radius-full);
          cursor: pointer;
          box-shadow: 0 2px 0 #cbd5e1;
        }

        .mastery-star-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          border: 2px solid #fde68a;
          color: #b45309;
          font-weight: 900;
          font-size: 0.76rem;
          padding: 6px 12px;
          border-radius: var(--radius-full);
        }

        .unit-banner-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .unit-icon-cube {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .unit-super-tag {
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .unit-main-title {
          font-size: 1.45rem;
          font-weight: 900;
          line-height: 1.2;
        }

        .unit-tagline {
          font-size: 0.86rem;
          color: #475569;
          margin-top: 2px;
        }

        /* Stepping Stones Path */
        .course-stones-track {
          padding: 40px 20px 60px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 52px;
          position: relative;
        }

        .stone-node-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .stone-connector-line {
          position: absolute;
          top: 80px;
          width: 4px;
          height: 52px;
          border-left: 4px dashed #cbd5e1;
          z-index: 1;
        }

        .node-assembly {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          z-index: 2;
        }

        /* Chunky Round Stone Button */
        .chunky-stone {
          width: 84px;
          height: 84px;
          border-radius: 50%;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          outline: none;
          transition: all 0.12s ease;
        }

        .chunky-stone.completed {
          background: var(--duo-green);
          box-shadow: 0 8px 0 var(--duo-green-dark);
        }
        .chunky-stone.completed:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 0 var(--duo-green-dark);
        }
        .chunky-stone.completed:active {
          transform: translateY(6px);
          box-shadow: 0 2px 0 var(--duo-green-dark);
        }

        .chunky-stone.active {
          background: var(--duo-blue);
          box-shadow: 0 8px 0 var(--duo-blue-dark);
        }
        .chunky-stone.active:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 0 var(--duo-blue-dark);
        }
        .chunky-stone.active:active {
          transform: translateY(6px);
          box-shadow: 0 2px 0 var(--duo-blue-dark);
        }

        .chunky-stone.locked {
          background: #e2e8f0;
          box-shadow: 0 8px 0 #cbd5e1;
          cursor: not-allowed;
        }

        .start-banner-badge {
          position: absolute;
          top: -14px;
          background: var(--duo-yellow);
          color: #78350f;
          font-weight: 900;
          font-size: 0.72rem;
          padding: 2px 10px;
          border-radius: var(--radius-full);
          box-shadow: 0 3px 0 var(--duo-yellow-dark);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .stone-label-box {
          background: #ffffff;
          border: 2px solid #e2e8f0;
          border-radius: var(--radius-md);
          box-shadow: 0 4px 0 #e2e8f0;
          padding: 12px 16px;
          width: 220px;
          text-align: center;
          cursor: pointer;
          transition: all 0.12s ease;
        }
        .stone-label-box:hover {
          border-color: #cbd5e1;
          transform: translateY(-2px);
          box-shadow: 0 6px 0 #cbd5e1;
        }

        .stone-label-box.locked-box {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .stone-label-box.locked-box:hover {
          transform: none;
          box-shadow: 0 4px 0 #e2e8f0;
          border-color: #e2e8f0;
        }

        .label-badge-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-bottom: 6px;
        }

        .passed-badge {
          font-size: 0.68rem;
          font-weight: 900;
          color: var(--duo-green-dark);
          background: var(--duo-green-bg);
          padding: 2px 6px;
          border-radius: var(--radius-full);
        }

        .upcoming-tag {
          font-size: 0.68rem;
          font-weight: 800;
          color: #64748b;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          padding: 2px 6px;
          border-radius: var(--radius-full);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .label-title {
          font-size: 0.95rem;
          font-weight: 900;
          color: #1e293b;
          line-height: 1.3;
          margin-bottom: 4px;
        }

        .label-footer {
          font-size: 0.74rem;
          color: #94a3b8;
          font-weight: 700;
        }

        .empty-topic-banner {
          margin: 40px 16px;
          padding: 30px 20px;
          text-align: center;
          background: #ffffff;
          border: 2px solid #e2e8f0;
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
      `}</style>
    </div>
  );
}

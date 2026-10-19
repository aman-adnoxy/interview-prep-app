import React from 'react';
import { 
  ArrowLeft, 
  Check, 
  Lock, 
  Star, 
  Play, 
  Sparkles
} from 'lucide-react';
import { sound } from '../services/sound';
import { getTopicTheme, getStageTheme } from '../topicThemes';
import {
  groupSectionsByStage,
  countPublishedSections,
  countCompletedSections,
} from '../services/stages';

export default function TopicLearningPath({
  topic,
  progressMap = {},
  onSelectSection,
  onBackToTracks
}) {
  const config = getTopicTheme(topic?.id);
  const Icon = config.icon;

  const stageGroups = groupSectionsByStage(topic);
  const sections = stageGroups.flatMap((group) => group.sections);

  // Progress counts are published-section based (upcoming excluded)
  const totalSections = sections.filter((s) => s?.status === 'published').length;
  const completedSections = sections.filter(
    (s) => s?.status === 'published' && progressMap[s.id]?.completed
  ).length;

  // Zig-zag offsets for Duolingo winding path (per stone inside a stage)
  const offsets = [0, 42, -36, 48, -42, 24, -24];

  // "Current" semantics preserved: first published section whose predecessor
  // in overall manifest order is completed (or the very first one)
  const isCurrentSection = (section) => {
    if (section?.status !== 'published') return false;
    if (progressMap[section.id]?.completed) return false;
    const flatIndex = sections.findIndex((s) => s.id === section.id);
    if (flatIndex <= 0) return true;
    const previous = sections[flatIndex - 1];
    return Boolean(previous?.status !== 'published' || progressMap[previous.id]?.completed);
  };

  return (
    <div className="duo-path-page animate-slide-up">
      {/* Unit Header Banner */}
      <header className="unit-header-box" style={{ background: config.bg, borderColor: config.color }}>
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
            <div className="unit-super-tag" style={{ color: config.colorDark }}>LEARNING TRACK</div>
            <h1 className="unit-main-title" style={{ color: config.titleColor }}>{topic.title}</h1>
            <p className="unit-tagline">{topic.description}</p>
          </div>
        </div>
      </header>

      {/* Stepping Stones Course Path — grouped into manifest-defined stages */}
      <div className="course-stones-track">
        {sections.length === 0 && (
          <div className="empty-topic-banner">
            <Lock size={36} color="#94a3b8" />
            <h3>Curriculum Launching Soon</h3>
            <p>New interactive sections for {topic.title} are in the content pipeline.</p>
          </div>
        )}

        {stageGroups.map((group, groupIdx) => {
          const stageTheme = getStageTheme(group.stage?.id, groupIdx);
          const stagePublished = countPublishedSections(group);
          const stageCompleted = countCompletedSections(group, progressMap);
          const previousGroupLast = groupIdx > 0
            ? stageGroups[groupIdx - 1].sections[stageGroups[groupIdx - 1].sections.length - 1]
            : null;

          if (group.sections.length === 0 && !group.stage) return null;

          return (
            <section
              key={group.stage?.id || `stage-${groupIdx}`}
              className="stage-band"
              style={{ background: stageTheme.bg, borderColor: stageTheme.border }}
              aria-labelledby={group.stage?.id ? `stage-title-${group.stage.id}` : undefined}
            >
              {group.stage ? (
                <header className="stage-header">
                  <span className="stage-order-chip" style={{ background: stageTheme.border, color: stageTheme.textColor }}>
                    {Number.isFinite(group.stage.order) ? `STAGE ${group.stage.order}` : 'STAGE'}
                  </span>
                  <div className="stage-heading-block">
                    <h2 id={group.stage?.id ? `stage-title-${group.stage.id}` : undefined} className="stage-title" style={{ color: stageTheme.textColor }}>
                      {group.title}
                    </h2>
                    {group.description && <p className="stage-description">{group.description}</p>}
                  </div>
                  {stagePublished > 0 && (
                    <span className="stage-progress-chip" style={{ color: stageTheme.textColor }}>
                      {stageCompleted}/{stagePublished}
                    </span>
                  )}
                </header>
              ) : (
                <header className="stage-header">
                  <div className="stage-heading-block">
                    <h2 className="stage-title" style={{ color: stageTheme.textColor }}>More lessons</h2>
                    <p className="stage-description">Lessons awaiting stage assignment in the curriculum.</p>
                  </div>
                </header>
              )}

              <div className="stage-stones">
                {group.sections.length === 0 ? (
                  <p className="stage-empty-note">Lessons for this stage are coming soon.</p>
                ) : group.sections.map((section, idx) => {
                  const prog = progressMap[section.id];
                  const isCompleted = Boolean(prog?.completed);
                  const isPublished = section.status === 'published';
                  const isCurrent = isCurrentSection(section);
                  const isLastInStage = idx === group.sections.length - 1;
                  // Connect within a stage; the stage band boundary visually
                  // separates stages unless the previous stage ended completed
                  const drawConnector = !isLastInStage || Boolean(
                    groupIdx === stageGroups.length - 1 ? false
                      : previousGroupLast && progressMap[previousGroupLast.id]?.completed
                  );
                  const scoreTotal = section.questionCount ?? prog?.totalQuestions;
                  const xOffset = offsets[idx % offsets.length];

                  return (
                    <div 
                      key={section.id} 
                      className="stone-node-wrap"
                      style={{ transform: `translateX(${xOffset}px)` }}
                    >
                      {drawConnector && (
                        <div className="stone-connector-line" />
                      )}

                      <div className="node-assembly">
                        <button
                          className={`chunky-stone ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''} ${!isPublished ? 'locked' : ''}`}
                          onClick={() => {
                            if (!isPublished) return;
                            sound.playTap();
                            onSelectSection(section);
                          }}
                          disabled={!isPublished}
                          title={
                            !isPublished 
                              ? `${section.title} (Upcoming)` 
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
                        <button
                          type="button"
                          className={`stone-label-box ${!isPublished ? 'locked-box' : ''}`} 
                          onClick={() => {
                            if (!isPublished) return;
                            sound.playTap();
                            onSelectSection(section);
                          }}
                          disabled={!isPublished}
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
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
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

        /* Stage bands: manifest-owned stages, subtle presentation tints */
        .stage-band {
          width: 100%;
          max-width: 480px;
          border: 2px solid;
          border-radius: var(--radius-lg);
          padding: 18px 14px 26px 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .stage-header {
          width: 100%;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 26px;
          padding: 0 6px;
        }

        .stage-order-chip {
          flex-shrink: 0;
          font-size: 0.62rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          padding: 4px 9px;
          border-radius: var(--radius-full);
          margin-top: 2px;
        }

        .stage-heading-block {
          flex: 1;
          min-width: 0;
        }

        .stage-title {
          font-size: 1.02rem;
          font-weight: 900;
          line-height: 1.3;
        }

        .stage-description {
          font-size: 0.78rem;
          color: #64748b;
          line-height: 1.45;
          margin-top: 2px;
        }

        .stage-progress-chip {
          flex-shrink: 0;
          font-size: 0.74rem;
          font-weight: 900;
          background: #ffffff;
          border: 2px solid rgba(0, 0, 0, 0.06);
          padding: 3px 10px;
          border-radius: var(--radius-full);
          margin-top: 2px;
        }

        .stage-stones {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 48px;
          position: relative;
          width: 100%;
        }

        .stage-empty-note {
          font-size: 0.82rem;
          color: #94a3b8;
          font-weight: 700;
          text-align: center;
          padding: 12px;
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

        .chunky-stone:focus-visible,
        .stone-label-box:focus-visible,
        .btn-back-tracks:focus-visible {
          outline: 3px solid #2563eb;
          outline-offset: 3px;
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
          font-family: inherit;
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

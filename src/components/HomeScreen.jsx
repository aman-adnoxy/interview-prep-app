import React from 'react';
import {
  Flame,
  Trophy,
  Play,
  BookOpen,
  ChevronRight,
  Lock,
  XCircle,
  Map,
  ArrowRight
} from 'lucide-react';
import { sound } from '../services/sound';
import { getTopicTheme } from '../topicThemes';

/**
 * Home = the personal learning dashboard.
 * Answers one question: "What should I work on next?"
 */
export default function HomeScreen({
  manifest,
  progressMap = {},
  streak = 0,
  activityDays = [],
  attempts = [],
  currentLesson,
  continueSection,
  weakTopics = [],
  recentAccuracy = null,
  onOpenSection,
  onOpenProgress,
  onOpenTracks,
  onOpenTopic
}) {
  if (!manifest?.topics) return null;

  const publishedSections = manifest.topics.flatMap((topic) => topic.sections || [])
    .filter((section) => section.status === 'published');
  const completedSections = publishedSections.filter((s) => progressMap[s.id]?.completed).length;
  const isAllComplete = publishedSections.length > 0 && completedSections.length === publishedSections.length;

  // Deterministic continue state (priority honored by App's section resolution)
  const continueProgress = continueSection ? progressMap[continueSection.id] : null;
  const continueLessonId = continueSection?.lessonId || continueSection?.id;
  const hasStarted = Boolean(continueProgress?.attemptsCount > 0)
    || Boolean(currentLesson && currentLesson.id === continueLessonId);
  const estimatedMinutes = currentLesson?.id === continueLessonId && Number.isFinite(currentLesson?.estimatedMinutes)
    ? currentLesson.estimatedMinutes
    : null;
  const continueTopic = continueSection
    ? manifest.topics.find((topic) => topic.id === continueSection.topicId)
    : null;
  const continueTheme = continueTopic ? getTopicTheme(continueTopic.id) : null;

  return (
    <div className="home-dashboard animate-slide-up">
      {/* Hero */}
      <div className="home-hero">
        <h1 className="home-title">Your engineering journey</h1>
        <p className="home-tagline">Small steps. Strong fundamentals.</p>
      </div>

      {/* Stats overview */}
      <div className="home-stats-row">
        <div className="home-stat-card">
          <span className="home-stat-value">{completedSections}/{publishedSections.length}</span>
          <span className="home-stat-label">Sections done</span>
        </div>
        <div className="home-stat-card streak-card">
          <div className="streak-main">
            <Flame size={18} fill="#f59e0b" className="flame-icon" />
            <span className="home-stat-value">{streak} {streak === 1 ? 'day' : 'days'}</span>
          </div>
          <span className="home-stat-label">Study streak</span>
          <div className="circle-ring">
            {activityDays.map((active, idx) => (
              <span key={idx} className={`ring-dot ${active ? 'active' : ''}`} title={`Day ${activityDays.length - idx}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Primary action: Continue learning (deterministic) */}
      {continueSection && !isAllComplete && (
        <div className="continue-card" style={{ '--theme-c': continueTheme?.color, '--theme-dark': continueTheme?.colorDark }}>
          <div className="continue-kicker">
            <Map size={13} />
            <span>{continueSection.topicTitle?.toUpperCase()} · MODULE {manifest.topics.findIndex((t) => t.id === continueSection.topicId) + 1}</span>
          </div>
          <h2 className="continue-title">{continueSection.title}</h2>
          <p className="continue-sub">
            {hasStarted ? 'Pick up where you left off' : 'Understand the concepts, then take the knowledge check'}
          </p>
          <div className="continue-meta">
            {estimatedMinutes && Number.isFinite(estimatedMinutes) && estimatedMinutes > 0 && (
              <span className="continue-time-chip">~{estimatedMinutes} min suggested</span>
            )}
            {continueSection.questionCount && (
              <span className="continue-time-chip">{continueSection.questionCount} knowledge checks</span>
            )}
            {attempts.some((a) => a.sectionId === continueSection.id) && (
              <span className="continue-time-chip accent">
                {attempts.filter((a) => a.sectionId === continueSection.id).length} attempts so far
              </span>
            )}
          </div>
          <button
            className="btn btn-primary continue-action-btn"
            onClick={() => { sound.playTap(); onOpenSection(continueSection); }}
          >
            <Play size={18} fill="#ffffff" />
            <span>{hasStarted ? 'Continue learning' : 'Start learning'}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* Curriculum complete → practice state */}
      {isAllComplete && (
        <div className="continue-card mastered">
          <div className="continue-kicker"><Trophy size={13} /><span>ALL PUBLISHED SECTIONS MASTERED</span></div>
          <h2 className="continue-title">Keep it sharp</h2>
          <p className="continue-sub">Revisit revision sheets and knowledge checks to stay interview-ready.</p>
          <div className="continue-meta">
            <button
              className="btn btn-primary continue-action-btn"
              onClick={() => { sound.playTap(); onOpenTracks(); }}
            >
              <BookOpen size={18} />
              <span>Browse curriculum</span>
            </button>
          </div>
        </div>
      )}

      {/* Explore tracks (compact) */}
      <div className="home-section-header">
        <h3>Explore your tracks</h3>
        <button className="home-see-all" onClick={() => { sound.playTap(); onOpenTracks(); }}>
          Full curriculum <ChevronRight size={14} />
        </button>
      </div>
      <div className="home-tracks-list">
        {manifest.topics.map((topic) => {
          const theme = getTopicTheme(topic.id);
          const Icon = theme.icon;
          const sections = topic.sections || [];
          const published = sections.filter((s) => s.status === 'published');
          const done = published.filter((s) => progressMap[s.id]?.completed).length;

          return (
            <button
              key={topic.id}
              className="home-track-card"
              onClick={() => { sound.playTap(); onOpenTopic(topic); }}
            >
              <span className="home-track-icon" style={{ background: theme.bg, color: theme.colorDark }}>
                <Icon size={22} />
              </span>
              <span className="home-track-body">
                <span className="home-track-name">{topic.title}</span>
                <span className="home-track-desc">
                  {published.length > 0
                    ? `${published.length} sections published · ${done} mastered`
                    : 'Launching soon'}
                </span>
              </span>
              {published.length > 0 ? <ChevronRight size={18} className="home-track-chevron" /> : <Lock size={15} className="home-track-chevron" />}
            </button>
          );
        })}
      </div>

      {/* Recent performance */}
      <div className="home-section-header">
        <h3>Your recent performance</h3>
        {weakTopics.length > 0 && (
          <button className="home-see-all" onClick={() => { sound.playTap(); onOpenProgress(); }}>
            View progress <ChevronRight size={14} />
          </button>
        )}
      </div>
      <div className="performance-card">
        <div className="perf-main">
          {recentAccuracy !== null ? (
            <><span className="perf-value">{recentAccuracy}%</span><span className="perf-label">quiz accuracy (last 3 attempts)</span></>
          ) : (
            <><span className="perf-value muted">—</span><span className="perf-label">quiz accuracy</span></>
          )}
        </div>
        {weakTopics.length > 0 && (
          <div className="weak-block">
            <div className="perf-mini-label">Topics to revisit</div>
            {weakTopics.map(({ sectionId, title, pct }) => (
              <button key={sectionId} className="weak-topic-row" onClick={() => { sound.playTap(); onOpenSection({ id: sectionId }); }}>
                <XCircle size={16} className="weak-icon" />
                <span className="weak-title">{title}</span>
                <span className="weak-pct">{pct}%</span>
                <ChevronRight size={15} className="weak-chevron" />
              </button>
            ))}
          </div>
        )}
        {recentAccuracy === null && weakTopics.length === 0 && (
          <p className="perf-hint">
            Once you take knowledge checks, your recent accuracy and topics to revisit appear here.
          </p>
        )}
      </div>

      <style>{`
        .home-dashboard {
          padding: 22px 16px 110px 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .home-hero { margin-bottom: 2px; }
        .home-title { font-size: 1.5rem; font-weight: 900; color: #1e293b; line-height: 1.2; }
        .home-tagline { font-size: 0.9rem; color: #64748b; margin-top: 4px; }

        .home-stats-row { display: flex; gap: 12px; }
        .home-stat-card {
          flex: 1;
          background: #ffffff;
          border: 2px solid #e2e8f0;
          border-radius: var(--radius-lg);
          box-shadow: 0 4px 0 #e2e8f0;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .home-stat-value { font-size: 1.35rem; font-weight: 900; color: #1e293b; line-height: 1.15; display: flex; align-items: center; gap: 6px; }
        .home-stat-label { font-size: 0.66rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.06em; text-transform: uppercase; }
        .streak-main { display: flex; align-items: center; gap: 6px; }
        .flame-icon { color: #f59e0b; }
        .circle-ring { display: flex; gap: 5px; margin-top: 8px; }
        .ring-dot {
          width: 10px; height: 10px; border-radius: 50%;
          background: #f1f5f9; border: 1px solid #e2e8f0;
        }
        .ring-dot.active { background: var(--duo-orange, #ff9600); border-color: var(--duo-yellow-dark); }

        .continue-card {
          background: #ffffff;
          border: 2px solid #e2e8f0;
          border-radius: var(--radius-lg);
          box-shadow: 0 4px 0 #e2e8f0;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .continue-card.mastered { border-color: #a7f3d0; box-shadow: 0 4px 0 #a7f3d0; }
        .continue-kicker {
          display: flex; align-items: center; gap: 6px;
          font-size: 0.68rem; font-weight: 900; letter-spacing: 0.08em;
          color: var(--theme-dark, #46a302);
          text-transform: uppercase;
        }
        .continue-title { font-size: 1.3rem; font-weight: 900; color: #1e293b; line-height: 1.25; }
        .continue-sub { font-size: 0.88rem; color: #64748b; line-height: 1.45; }
        .continue-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 2px; }
        .continue-time-chip {
          font-size: 0.7rem; font-weight: 800; color: #64748b;
          background: #f1f5f9; border: 1px solid #e2e8f0;
          padding: 3px 9px; border-radius: var(--radius-full);
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .continue-time-chip.accent { color: var(--duo-blue-dark); background: var(--duo-blue-light); border-color: #bfdbfe; }
        .continue-action-btn { width: 100%; margin-top: 8px; justify-content: space-between; }
        .continue-card.mastered .continue-action-btn { justify-content: center; }

        .home-section-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-top: 6px;
        }
        .home-section-header h3 { font-size: 1.02rem; font-weight: 900; color: #1e293b; }
        .home-see-all {
          display: inline-flex; align-items: center; gap: 3px;
          background: transparent; border: none; cursor: pointer;
          font-size: 0.78rem; font-weight: 800; color: var(--duo-blue-dark);
          font-family: inherit;
        }

        .home-tracks-list { display: flex; flex-direction: column; gap: 10px; }
        .home-track-card {
          display: flex; align-items: center; gap: 14px;
          width: 100%; text-align: left;
          background: #ffffff; border: 2px solid #e2e8f0;
          border-radius: var(--radius-lg);
          box-shadow: 0 4px 0 #e2e8f0;
          padding: 14px 16px;
          cursor: pointer;
          font-family: inherit;
          transition: all var(--transition-fast);
        }
        .home-track-card:hover { border-color: #cbd5e1; transform: translateY(-2px); }
        .home-track-card:active { transform: translateY(4px); box-shadow: 0 0 0 #e2e8f0; }
        .home-track-icon {
          width: 46px; height: 46px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid rgba(0,0,0,0.05); flex-shrink: 0;
        }
        .home-track-body { flex: 1; display: flex; flex-direction: column; gap: 1px; min-width: 0; }
        .home-track-name { font-size: 0.98rem; font-weight: 900; color: #1e293b; }
        .home-track-desc { font-size: 0.76rem; color: #64748b; font-weight: 600; }
        .home-track-chevron { color: #94a3b8; flex-shrink: 0; }

        .performance-card {
          background: #ffffff; border: 2px solid #e2e8f0;
          border-radius: var(--radius-lg);
          box-shadow: 0 4px 0 #e2e8f0;
          padding: 16px;
          display: flex; flex-direction: column; gap: 12px;
        }
        .perf-main { display: flex; align-items: baseline; gap: 10px; }
        .perf-value { font-size: 1.6rem; font-weight: 900; color: var(--duo-green-dark); }
        .perf-value.muted { color: #cbd5e1; }
        .perf-label { font-size: 0.78rem; color: #64748b; font-weight: 700; }
        .perf-mini-label { font-size: 0.66rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
        .weak-block { display: flex; flex-direction: column; gap: 6px; border-top: 1px solid #f1f5f9; padding-top: 10px; }
        .weak-topic-row {
          display: flex; align-items: center; gap: 8px;
          background: #fff1f2; border: 1px solid #fecaca;
          border-radius: var(--radius-md); padding: 9px 12px;
          cursor: pointer; font-family: inherit; width: 100%;
          text-align: left; transition: background var(--transition-fast);
        }
        .weak-topic-row:hover { background: #ffe4e6; }
        .weak-icon { color: var(--duo-red); flex-shrink: 0; }
        .weak-title { flex: 1; font-size: 0.86rem; font-weight: 800; color: #1e293b; min-width: 0; }
        .weak-pct { font-size: 0.76rem; font-weight: 900; color: var(--duo-red-dark); }
        .weak-chevron { color: #f43f5e88; flex-shrink: 0; }
        .perf-hint { font-size: 0.84rem; color: #94a3b8; line-height: 1.45; }
      `}</style>
    </div>
  );
}

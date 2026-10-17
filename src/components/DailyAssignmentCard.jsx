import React from 'react';
import { 
  Calendar, 
  Clock, 
  HelpCircle, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Briefcase, 
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { getTodayKolkataString } from '../services/api';
import { sound } from '../services/sound';

export default function DailyAssignmentCard({
  section,
  progress,
  onStartLesson,
  onStartQuiz,
  onOpenScenario
}) {
  const today = getTodayKolkataString();
  const isCompleted = progress?.completed;
  const lastScore = progress?.lastScore;
  const questionCount = section?.questionCount || 8;

  return (
    <div className="daily-card animate-slide-up">
      {/* Top Tag & Track */}
      <div className="card-top">
        <div className="date-chip">
          <Calendar size={14} className="cal-icon" />
          <span>TODAY'S MISSION</span>
        </div>
        <span className={`badge badge-${section.difficulty || 'beginner'}`}>
          {section.difficulty || 'Beginner'}
        </span>
      </div>

      {/* Main Assignment Info */}
      <div className="assignment-details">
        <div className="track-kicker">
          <span>{section.topicTitle || 'Databases Track'}</span>
          <span className="dot-sep">•</span>
          <span>Unit 1</span>
        </div>
        <h2 className="section-title">{section.title}</h2>
        <p className="assignment-subtitle">
          Learn indexing mental models, B-trees, selectivity, and query planner trade-offs with practical PostgreSQL examples.
        </p>

        {/* Metric Badges */}
        <div className="metrics-bar">
          <div className="metric-pill">
            <Clock size={16} className="metric-icon clock" />
            <div className="metric-meta">
              <span className="metric-val">25 min</span>
              <span className="metric-lbl">EST. TIME</span>
            </div>
          </div>
          <div className="metric-divider"></div>
          <div className="metric-pill">
            <HelpCircle size={16} className="metric-icon quiz" />
            <div className="metric-meta">
              <span className="metric-val">{questionCount} Qs</span>
              <span className="metric-lbl">ACTIVE RECALL</span>
            </div>
          </div>
          <div className="metric-divider"></div>
          <div className="metric-pill">
            <Briefcase size={16} className="metric-icon case" />
            <div className="metric-meta">
              <span className="metric-val">1 Case</span>
              <span className="metric-lbl">DIAGNOSTIC</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      {isCompleted ? (
        <div className="status-banner completed-banner">
          <CheckCircle2 size={22} className="status-icon done" />
          <div className="status-text">
            <strong>Section Mastered!</strong>
            <span>Best score: {lastScore ?? questionCount}/{questionCount} questions correct</span>
          </div>
        </div>
      ) : (
        <div className="status-banner ready-banner">
          <Sparkles size={22} className="status-icon ready" />
          <div className="status-text">
            <strong>Ready to learn!</strong>
            <span>Follow the step-by-step concepts, then take the knowledge check.</span>
          </div>
        </div>
      )}

      {/* Primary Action Buttons */}
      <div className="action-buttons">
        <button 
          className="btn btn-primary main-action-btn" 
          onClick={() => { sound.playTap(); onStartLesson(); }}
        >
          <BookOpen size={20} />
          <span>{isCompleted ? 'REVIEW LESSON' : 'START LESSON'}</span>
          <ArrowRight size={20} />
        </button>

        <div className="secondary-actions">
          <button 
            className="btn btn-secondary sub-action-btn" 
            onClick={() => { sound.playTap(); onStartQuiz(); }}
          >
            <RotateCcw size={16} />
            <span>{isCompleted ? 'Retake Quiz' : 'Jump to Quiz'}</span>
          </button>
          <button 
            className="btn btn-secondary sub-action-btn" 
            onClick={() => { sound.playTap(); onOpenScenario(); }}
          >
            <Briefcase size={16} />
            <span>Interview Case</span>
          </button>
        </div>
      </div>

      <style>{`
        .daily-card {
          margin: 18px 16px;
          padding: 24px 20px;
          background: #ffffff;
          border: 2px solid #e2e8f0;
          border-radius: var(--radius-lg);
          box-shadow: 0 4px 0 #e2e8f0;
        }

        .card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .date-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          color: var(--duo-blue-dark);
          font-weight: 900;
          background: var(--duo-blue-light);
          padding: 4px 10px;
          border-radius: var(--radius-full);
          letter-spacing: 0.05em;
        }

        .cal-icon {
          color: var(--duo-blue-dark);
        }

        .track-kicker {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.74rem;
          text-transform: uppercase;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: var(--duo-green-dark);
          margin-bottom: 4px;
        }

        .dot-sep {
          color: #94a3b8;
        }

        .section-title {
          font-size: 1.45rem;
          line-height: 1.25;
          margin-bottom: 10px;
          font-weight: 900;
          letter-spacing: -0.02em;
          color: #1e293b;
        }

        .assignment-subtitle {
          font-size: 0.92rem;
          color: #475569;
          line-height: 1.55;
          margin-bottom: 20px;
        }

        .metrics-bar {
          display: flex;
          align-items: center;
          background: #f8fafc;
          padding: 12px 14px;
          border-radius: var(--radius-md);
          margin-bottom: 20px;
          border: 2px solid #f1f5f9;
        }

        .metric-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          justify-content: center;
        }

        .metric-icon.clock { color: #0284c7; }
        .metric-icon.quiz { color: #7c3aed; }
        .metric-icon.case { color: #e11d48; }

        .metric-meta {
          display: flex;
          flex-direction: column;
        }

        .metric-val {
          font-size: 0.88rem;
          font-weight: 900;
          color: #1e293b;
          line-height: 1.1;
        }

        .metric-lbl {
          font-size: 0.62rem;
          font-weight: 800;
          color: #94a3b8;
          letter-spacing: 0.06em;
          margin-top: 2px;
        }

        .metric-divider {
          width: 2px;
          height: 24px;
          background: #e2e8f0;
        }

        .status-banner {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border-radius: var(--radius-md);
          margin-bottom: 22px;
        }

        .completed-banner {
          background: #ecfdf5;
          border: 2px solid #a7f3d0;
        }
        .status-icon.done { color: var(--duo-green-dark); }

        .ready-banner {
          background: #eff6ff;
          border: 2px solid #bfdbfe;
        }
        .status-icon.ready { color: var(--duo-blue-dark); }

        .status-text {
          display: flex;
          flex-direction: column;
          font-size: 0.86rem;
          line-height: 1.4;
        }

        .status-text strong {
          color: #1e293b;
          font-weight: 800;
        }

        .status-text span {
          color: #475569;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .main-action-btn {
          width: 100%;
          justify-content: space-between;
          padding: 16px 20px;
        }

        .secondary-actions {
          display: flex;
          gap: 10px;
        }

        .sub-action-btn {
          flex: 1;
          font-size: 0.86rem;
          padding: 12px 10px;
          text-transform: none;
        }
      `}</style>
    </div>
  );
}

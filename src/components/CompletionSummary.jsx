import React from 'react';
import { 
  Trophy, 
  RotateCcw, 
  BookOpen, 
  XCircle, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { sound } from '../services/sound';

export default function CompletionSummary({
  score,
  total,
  records = [],
  onRetakeQuiz,
  onReviewLesson,
  onDone
}) {
  const percentage = Math.round((score / total) * 100);
  const passed = percentage >= 75;
  const missedRecords = records.filter((r) => !r.correct);

  return (
    <div className="duo-summary-page animate-slide-up">
      {/* Hero Result Banner */}
      <div className="summary-hero-card">
        <div className={`hero-mascot-badge ${passed ? 'pass' : 'retry'}`}>
          <Trophy size={48} />
        </div>
        <h2 className="summary-headline">
          {passed ? 'Lesson Complete!' : 'Practice Makes Perfect!'}
        </h2>
        <p className="summary-subtext">
          {passed 
            ? 'You mastered the key technical concepts for this interview section.'
            : 'Review the explanations below and solidify your database mental model.'}
        </p>

        {/* Score Ring / Pill */}
        <div className="score-summary-pill">
          <div className="score-main">
            <span className="score-num">{score}</span>
            <span className="score-total">/{total}</span>
          </div>
          <div className="score-badge-pct">
            {percentage}% ACCURACY
          </div>
        </div>
      </div>

      {/* Concepts to Revisit */}
      {missedRecords.length > 0 ? (
        <div className="review-section">
          <div className="section-title">CONCEPTS TO REVISIT ({missedRecords.length})</div>
          <div className="missed-cards-stack">
            {missedRecords.map((m, idx) => (
              <div key={idx} className="missed-item-card">
                <div className="missed-head">
                  <XCircle size={18} className="missed-icon" />
                  <span className="missed-q">{m.questionPrompt}</span>
                </div>
                <div className="missed-ans">
                  <strong>Key Takeaway:</strong> {m.explanation}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="perfect-card">
          <Sparkles size={26} className="perfect-sparkle" />
          <div>
            <strong>100% Flawless Mastery!</strong>
            <p>Every single knowledge-check question was answered accurately.</p>
          </div>
        </div>
      )}

      {/* Bottom Buttons */}
      <div className="summary-actions-bottom">
        <button 
          className="btn btn-primary continue-btn-chunky"
          onClick={() => { sound.playTap(); onDone(); }}
        >
          <span>CONTINUE COURSE</span>
          <ArrowRight size={20} />
        </button>

        <div className="summary-secondary-row">
          <button 
            className="btn btn-secondary sub-action"
            onClick={() => { sound.playTap(); onRetakeQuiz(); }}
          >
            <RotateCcw size={16} />
            <span>Retake Quiz</span>
          </button>
          <button 
            className="btn btn-secondary sub-action"
            onClick={() => { sound.playTap(); onReviewLesson(); }}
          >
            <BookOpen size={16} />
            <span>Review Lesson</span>
          </button>
        </div>
      </div>

      <style>{`
        .duo-summary-page {
          padding: 24px 20px 40px 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          background: #f7f9fa;
          min-height: 100vh;
        }

        .summary-hero-card {
          background: #ffffff;
          border: 2px solid #e2e8f0;
          border-radius: var(--radius-lg);
          padding: 32px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 4px 0 #e2e8f0;
        }

        .hero-mascot-badge {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .hero-mascot-badge.pass {
          background: var(--duo-yellow-light);
          color: #d97706;
          border: 3px solid #fde68a;
          box-shadow: 0 4px 0 #fde68a;
        }

        .hero-mascot-badge.retry {
          background: var(--duo-blue-light);
          color: var(--duo-blue-dark);
          border: 3px solid #bfdbfe;
          box-shadow: 0 4px 0 #bfdbfe;
        }

        .summary-headline {
          font-size: 1.5rem;
          font-weight: 900;
          color: #1e293b;
          margin-bottom: 6px;
        }

        .summary-subtext {
          font-size: 0.92rem;
          color: #475569;
          line-height: 1.45;
          max-width: 300px;
          margin-bottom: 22px;
        }

        .score-summary-pill {
          display: flex;
          align-items: baseline;
          gap: 12px;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          padding: 8px 24px;
          border-radius: var(--radius-full);
        }

        .score-num {
          font-size: 2rem;
          font-weight: 900;
          color: #1e293b;
        }

        .score-total {
          font-size: 1.1rem;
          font-weight: 800;
          color: #94a3b8;
        }

        .score-badge-pct {
          font-size: 0.82rem;
          font-weight: 900;
          color: var(--duo-green-dark);
        }

        .review-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .section-title {
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: #64748b;
        }

        .missed-cards-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .missed-item-card {
          background: #ffffff;
          border: 2px solid #fee2e2;
          border-left: 6px solid var(--duo-red);
          border-radius: var(--radius-md);
          padding: 16px;
          box-shadow: 0 3px 0 #fee2e2;
        }

        .missed-head {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 8px;
        }

        .missed-icon {
          color: var(--duo-red);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .missed-q {
          font-size: 0.92rem;
          font-weight: 800;
          color: #1e293b;
          line-height: 1.35;
        }

        .missed-ans {
          font-size: 0.86rem;
          color: #475569;
          line-height: 1.5;
          padding-left: 28px;
        }

        .perfect-card {
          background: #ecfdf5;
          border: 2px solid #a7f3d0;
          border-radius: var(--radius-md);
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .perfect-sparkle {
          color: var(--duo-green-dark);
          flex-shrink: 0;
        }

        .perfect-card strong {
          display: block;
          font-size: 0.98rem;
          color: #065f46;
          margin-bottom: 2px;
        }

        .perfect-card p {
          font-size: 0.86rem;
          color: #047857;
        }

        .summary-actions-bottom {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 8px;
        }

        .continue-btn-chunky {
          width: 100%;
          padding: 16px;
        }

        .summary-secondary-row {
          display: flex;
          gap: 10px;
        }

        .sub-action {
          flex: 1;
          padding: 12px;
          font-size: 0.88rem;
          text-transform: none;
        }
      `}</style>
    </div>
  );
}

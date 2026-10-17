import React, { useState, useEffect } from 'react';
import { 
  History, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  Clock, 
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getQuizAttempts } from '../services/storage';
import { sound } from '../services/sound';

export default function HistoryModal({
  sectionId,
  sectionTitle,
  onClose,
  onRetakeQuiz
}) {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedAttemptId, setExpandedAttemptId] = useState(null);

  useEffect(() => {
    async function loadAttempts() {
      setLoading(true);
      const list = await getQuizAttempts(sectionId);
      // Sort newest first
      list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setAttempts(list);
      setLoading(false);
    }
    loadAttempts();
  }, [sectionId]);

  const toggleExpand = (id) => {
    sound.playTap();
    setExpandedAttemptId(expandedAttemptId === id ? null : id);
  };

  return (
    <div className="history-modal-overlay animate-slide-up">
      <div className="history-modal-box">
        {/* Header */}
        <div className="history-modal-header">
          <div className="header-left">
            <button className="btn-modal-back" onClick={() => { sound.playTap(); onClose(); }}>
              <ArrowLeft size={20} />
            </button>
            <div>
              <span className="history-kicker">AUDIT TRAIL</span>
              <h2 className="history-title">Quiz Attempts History</h2>
            </div>
          </div>
        </div>

        <div className="history-body">
          <div className="section-meta-chip">
            <span>{sectionTitle || 'Current Section'}</span>
          </div>

          {loading ? (
            <div className="history-loading">Loading attempt history...</div>
          ) : attempts.length === 0 ? (
            <div className="history-empty">
              <History size={40} className="empty-icon" />
              <h3>No Attempts Recorded Yet</h3>
              <p>Complete your first section quiz to start building your interview readiness audit trail.</p>
              <button 
                className="btn btn-primary mt-3"
                onClick={() => { sound.playTap(); onClose(); onRetakeQuiz(); }}
              >
                START QUIZ NOW
              </button>
            </div>
          ) : (
            <div className="attempts-stack">
              {attempts.map((att, idx) => {
                const dateStr = new Date(att.timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                const pct = Math.round((att.score / att.total) * 100);
                const isPassed = pct >= 75;
                const isExpanded = expandedAttemptId === (att.id || idx);

                return (
                  <div key={att.id || idx} className="attempt-card">
                    <div className="attempt-top-row" onClick={() => toggleExpand(att.id || idx)}>
                      <div className="attempt-badge-col">
                        <div className={`score-circle ${isPassed ? 'passed' : 'failed'}`}>
                          <span>{att.score}/{att.total}</span>
                        </div>
                      </div>

                      <div className="attempt-info-col">
                        <div className="attempt-number">
                          Attempt #{attempts.length - idx} • {pct}%
                        </div>
                        <div className="attempt-timestamp">
                          <Clock size={12} />
                          <span>{dateStr}</span>
                        </div>
                      </div>

                      <div className="attempt-expand-icon">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>

                    {/* Detailed Review Breakdown */}
                    {isExpanded && (
                      <div className="attempt-details-drawer">
                        <div className="details-header">Question by Question Review:</div>
                        <div className="records-list">
                          {att.records?.map((rec, rIdx) => (
                            <div key={rIdx} className={`rec-item ${rec.correct ? 'rec-correct' : 'rec-wrong'}`}>
                              <div className="rec-status-icon">
                                {rec.correct ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                              </div>
                              <div className="rec-content">
                                <p className="rec-prompt"><strong>Q{rIdx + 1}:</strong> {rec.questionPrompt}</p>
                                {!rec.correct && (
                                  <p className="rec-takeaway"><strong>Takeaway:</strong> {rec.explanation}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="history-modal-footer">
          <button 
            className="btn btn-primary full-width"
            onClick={() => { sound.playTap(); onClose(); onRetakeQuiz(); }}
          >
            <RotateCcw size={18} />
            <span>RETAKE THIS QUIZ</span>
          </button>
        </div>
      </div>

      <style>{`
        .history-modal-overlay {
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

        .history-modal-box {
          width: 100%;
          max-width: 480px;
          height: 88vh;
          background: #f7f9fa;
          border-radius: 28px 28px 0 0;
          border-top: 2px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.2);
          overflow: hidden;
        }

        .history-modal-header {
          padding: 16px 20px;
          background: #ffffff;
          border-bottom: 2px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .btn-modal-back {
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

        .history-kicker {
          font-size: 0.68rem;
          font-weight: 900;
          color: var(--duo-blue-dark);
          letter-spacing: 0.08em;
          display: block;
        }

        .history-title {
          font-size: 1.18rem;
          font-weight: 900;
          color: #1e293b;
        }

        .history-body {
          padding: 18px 20px;
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .section-meta-chip {
          background: #ffffff;
          border: 2px solid #e2e8f0;
          padding: 8px 14px;
          border-radius: var(--radius-full);
          font-size: 0.8rem;
          font-weight: 800;
          color: #64748b;
          text-align: center;
        }

        .history-loading {
          padding: 40px 0;
          text-align: center;
          font-weight: 700;
          color: #94a3b8;
        }

        .history-empty {
          text-align: center;
          padding: 60px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .empty-icon {
          color: #cbd5e1;
          margin-bottom: 8px;
        }

        .history-empty h3 {
          font-size: 1.2rem;
          font-weight: 900;
          color: #1e293b;
        }

        .history-empty p {
          font-size: 0.88rem;
          color: #64748b;
          line-height: 1.45;
          max-width: 300px;
        }

        .attempts-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .attempt-card {
          background: #ffffff;
          border: 2px solid #e2e8f0;
          border-radius: var(--radius-md);
          box-shadow: 0 3px 0 #e2e8f0;
          overflow: hidden;
        }

        .attempt-top-row {
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
        }

        .score-circle {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 0.86rem;
        }

        .score-circle.passed {
          background: var(--duo-green-bg);
          color: var(--duo-green-dark);
          border: 2px solid #a7f3d0;
        }

        .score-circle.failed {
          background: var(--duo-red-light);
          color: var(--duo-red-dark);
          border: 2px solid #fecaca;
        }

        .attempt-info-col {
          flex: 1;
        }

        .attempt-number {
          font-size: 0.95rem;
          font-weight: 800;
          color: #1e293b;
        }

        .attempt-timestamp {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.74rem;
          color: #94a3b8;
          font-weight: 700;
          margin-top: 2px;
        }

        .attempt-expand-icon {
          color: #94a3b8;
        }

        .attempt-details-drawer {
          background: #f8fafc;
          border-top: 2px solid #e2e8f0;
          padding: 14px 16px;
        }

        .details-header {
          font-size: 0.72rem;
          font-weight: 900;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 10px;
        }

        .records-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .rec-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          font-size: 0.84rem;
          line-height: 1.4;
        }

        .rec-correct {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
        }
        .rec-correct .rec-status-icon { color: var(--duo-green-dark); }

        .rec-wrong {
          background: #fff1f2;
          border: 1px solid #fecaca;
        }
        .rec-wrong .rec-status-icon { color: var(--duo-red-dark); }

        .rec-status-icon {
          margin-top: 2px;
          flex-shrink: 0;
        }

        .rec-prompt {
          color: #1e293b;
          margin-bottom: 4px;
        }

        .rec-takeaway {
          font-size: 0.78rem;
          color: #b91c1c;
          line-height: 1.4;
        }

        .history-modal-footer {
          padding: 14px 20px;
          background: #ffffff;
          border-top: 2px solid #e2e8f0;
        }

        .full-width {
          width: 100%;
        }
      `}</style>
    </div>
  );
}

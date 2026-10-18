import React, { useState } from 'react';
import '../attempt-history.css';
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

/**
 * Renders a list of quiz attempts (newest first) with per-question review.
 * Shared by the Progress screen and the attempt-history bottom sheet.
 */
export default function AttemptHistorySection({
  attempts = [],
  resolveTitle
}) {
  const [expandedAttemptId, setExpandedAttemptId] = useState(null);

  if (attempts.length === 0) {
    return (
      <div className="attempt-history-empty">
        <History size={40} className="empty-icon" />
        <h3>No Attempts Recorded Yet</h3>
        <p>Complete your first section quiz to start building your interview readiness audit trail.</p>
      </div>
    );
  }

  return (
    <div className="attempt-history-stack">
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
        const title = resolveTitle?.(att.sectionId, att);

        return (
          <div key={att.id || idx} className="attempt-card">
            <div className="attempt-top-row" onClick={() => setExpandedAttemptId(isExpanded ? null : (att.id || idx))}>
              <div className="attempt-badge-col">
                <div className={`score-circle ${isPassed ? 'passed' : 'failed'}`}>
                  <span>{att.score}/{att.total}</span>
                </div>
              </div>

              <div className="attempt-info-col">
                <div className="attempt-number">
                  {title && <span className="attempt-section-chip">{title}</span>}
                  {pct}%
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
  );
}

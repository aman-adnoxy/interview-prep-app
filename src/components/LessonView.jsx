import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Lightbulb, 
  AlertTriangle,
  Bookmark,
} from 'lucide-react';
import { sound } from '../services/sound';
import ContentBlock from './ContentBlock';

export default function LessonView({
  lesson,
  sectionId,
  onBack,
  onStartQuiz
}) {
  // Lesson reading position is persisted per section so a refresh
  // resumes on the same page/concept, not from the beginning
  const lessonStorageKey = sectionId ? `interview_prep_lesson_${sectionId}` : null;
  const [persisted] = useState(() => {
    if (!lessonStorageKey) return null;
    try {
      const stored = JSON.parse(localStorage.getItem(lessonStorageKey) || 'null');
      return stored && typeof stored === 'object' ? stored : null;
    } catch {
      return null;
    }
  });

  const concepts = lesson?.concepts || [];
  const totalConcepts = concepts.length;

  const clampConceptIndex = (index) => Math.max(0, Math.min(index, totalConcepts - 1));

  const [conceptIndex, setConceptIndex] = useState(
    () => (persisted && Number.isInteger(persisted.conceptIndex) ? clampConceptIndex(persisted.conceptIndex) : 0)
  );
  const [viewMode, setViewMode] = useState(() =>
    ['concept', 'tradeoffs', 'revision'].includes(persisted?.viewMode) ? persisted.viewMode : 'concept'
  );

  useEffect(() => {
    if (!lessonStorageKey) return;
    try {
      localStorage.setItem(lessonStorageKey, JSON.stringify({ conceptIndex, viewMode }));
    } catch {
      // localStorage unavailable; in-session state still works
    }
  }, [lessonStorageKey, conceptIndex, viewMode]);

  if (!lesson) {
    return (
      <div className="p-6 text-center">
        <p>Lesson not found.</p>
        <button className="btn btn-secondary mt-4" onClick={onBack}>Go Back</button>
      </div>
    );
  }

  const currentConcept = concepts[conceptIndex] || concepts[0];
  const isFirst = conceptIndex === 0;
  const isLast = conceptIndex === totalConcepts - 1;

  const handleNextConcept = () => {
    sound.playTap();
    if (!isLast) {
      setConceptIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Prompt to take quiz or review
      setViewMode('tradeoffs');
    }
  };

  const handlePrevConcept = () => {
    sound.playTap();
    if (!isFirst) {
      setConceptIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const progressPercent = totalConcepts > 0 ? ((conceptIndex + 1) / totalConcepts) * 100 : 0;

  return (
    <div className="duo-lesson-page animate-slide-up">
      {/* Top Header with Progress Bar */}
      <header className="lesson-top-bar">
        <button 
          className="lesson-back-btn" 
          onClick={() => { sound.playTap(); onBack(); }}
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </button>

        <div className="duo-lesson-progress-bar">
          <div 
            className="duo-progress-fill" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="lesson-step-counter">
          <span>{conceptIndex + 1}/{totalConcepts}</span>
        </div>
      </header>

      {/* Sub tabs for quick access if user wants to check trade-offs / revision */}
      <nav className="lesson-mode-bar">
        <button 
          className={`mode-btn ${viewMode === 'concept' ? 'active' : ''}`}
          onClick={() => { sound.playTap(); setViewMode('concept'); }}
        >
          <span>Concepts</span>
        </button>
        <button 
          className={`mode-btn ${viewMode === 'tradeoffs' ? 'active' : ''}`}
          onClick={() => { sound.playTap(); setViewMode('tradeoffs'); }}
        >
          <span>Trade-offs ({lesson.tradeoffsAndPitfalls?.length || 0})</span>
        </button>
        <button 
          className={`mode-btn ${viewMode === 'revision' ? 'active' : ''}`}
          onClick={() => { sound.playTap(); setViewMode('revision'); }}
        >
          <span>Revision Sheet</span>
        </button>
      </nav>

      {/* MAIN BODY: ONE TOPIC PER PAGE */}
      <main className="lesson-content-area">
        {viewMode === 'concept' && currentConcept && (
          <div className="concept-single-page animate-slide-up" key={currentConcept.id || conceptIndex}>
            
            {/* Concept Step Card */}
            <div className="concept-hero-card">
              <div className="concept-badge-row">
                <span className="concept-chip">CONCEPT {conceptIndex + 1} OF {totalConcepts}</span>
                <span className="lesson-time-chip">{lesson.difficulty}</span>
              </div>
              <h1 className="concept-main-title">
                {currentConcept.title.replace(/^\d+\.\s*/, '')}
              </h1>
              </div>

            {/* Mental Model Callout on first card */}
            {conceptIndex === 0 && lesson.mentalModel && (
              <div className="duo-callout-card duo-callout-yellow">
                <div className="callout-icon-wrap yellow">
                  <Lightbulb size={22} />
                </div>
                <div className="callout-text">
                  <strong>Mental Model:</strong>
                  <ContentBlock block={lesson.mentalModel} />
                </div>
              </div>
            )}

            <div className="examples-section">
              <div className="section-label">EXPLANATION & EXAMPLES</div>
              {(currentConcept.blocks || []).map((block, blockIdx) => <ContentBlock key={currentConcept.id + '-' + blockIdx} block={block} />)}
            </div>
          </div>
        )}

        {/* TRADEOFFS VIEW */}
        {viewMode === 'tradeoffs' && (
          <div className="tradeoffs-page animate-slide-up">
            <div className="section-hero-header">
              <div className="hero-icon-circle red">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h2>Trade-offs & Pitfalls</h2>
                <p>Crucial engineering considerations tested in interviews</p>
              </div>
            </div>

            {(lesson.tradeoffsAndPitfalls?.length || 0) > 0 ? (
              <div className="tradeoff-cards-list">
                {lesson.tradeoffsAndPitfalls.map((item, idx) => (
                  <div key={idx} className="tradeoff-box">
                    <div className="tradeoff-top-row">
                      <div className="tradeoff-marker">
                        <span className="tradeoff-num">{idx + 1}</span>
                      </div>
                      <span className="tradeoff-eyebrow">
                        {idx === lesson.tradeoffsAndPitfalls.length - 1
                          ? 'FINAL CONSIDERATION'
                          : `PITFALL ${idx + 1}`}
                      </span>
                    </div>
                    <div className="tradeoff-body">
                      <ContentBlock block={item} />
                    </div>
                  </div>
                ))}
                <div className="tradeoff-footnote">
                  <AlertTriangle size={15} />
                  <span>Interviewers probe trade-offs hardest here — know both sides of each choice.</span>
                </div>
              </div>
            ) : (
              <div className="tradeoff-empty">
                <AlertTriangle size={34} />
                <p>No trade-off notes published for this section yet.</p>
              </div>
            )}
          </div>
        )}

        {/* REVISION SHEET VIEW */}
        {viewMode === 'revision' && (
          <div className="revision-page animate-slide-up">
            <div className="section-hero-header">
              <div className="hero-icon-circle blue">
                <Bookmark size={24} />
              </div>
              <div>
                <h2>High-Yield Revision Sheet</h2>
                <p>Quick summary bullets for last-minute review</p>
              </div>
            </div>

            {(lesson.revisionSheet?.length || 0) > 0 ? (
              <>
                <div className="revision-progress-strip">
                  <Bookmark size={13} />
                  <span>{lesson.revisionSheet.length} high-yield notes · ~{lesson.estimatedMinutes || 5} min full review</span>
                </div>
                <div className="revision-cards-list">
                  {lesson.revisionSheet.map((note, idx) => (
                    <div key={idx} className="revision-box">
                      <div className="rev-check-circle">
                        <span className="rev-check">✓</span>
                      </div>
                      <div className="revision-body">
                        <span className="revision-eyebrow">TAKEAWAY {idx + 1}</span>
                        <ContentBlock block={note} />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="revision-quiz-cta btn btn-primary"
                  onClick={() => { sound.playTap(); onStartQuiz(); }}
                >
                  Ready? Test yourself
                </button>
              </>
            ) : (
              <div className="tradeoff-empty blue">
                <Bookmark size={34} />
                <p>No revision notes published for this section yet.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Chunky Bottom Pagination / Action Bar */}
      <footer className="lesson-footer-bar">
        {viewMode === 'concept' ? (
          <div className="pagination-action-row">
            <button 
              className="btn btn-secondary nav-arrow-btn"
              onClick={handlePrevConcept}
              disabled={isFirst}
              aria-label="Previous Concept"
            >
              <ArrowLeft size={20} />
            </button>

            {!isLast ? (
              <button className="btn btn-primary next-concept-btn" onClick={handleNextConcept}>
                <span>Next Concept</span>
                <ArrowRight size={20} />
              </button>
            ) : (
              <button 
                className="btn btn-primary next-concept-btn"
                onClick={() => { sound.playTap(); onStartQuiz(); }}
              >
                <span>Take Quiz ({lesson.questionCount} Qs)</span>
                <ArrowRight size={20} />
              </button>
            )}
          </div>
        ) : (
          <button 
            className="btn btn-primary full-action-btn"
            onClick={() => { sound.playTap(); onStartQuiz(); }}
          >
            <span>Start Section Quiz</span>
            <ArrowRight size={20} />
          </button>
        )}
      </footer>

      <style>{`
        .duo-lesson-page {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: #f7f9fa;
          padding-bottom: 110px;
        }

        .lesson-top-bar {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
          background: #ffffff;
          border-bottom: 2px solid #e2e8f0;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .lesson-back-btn {
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 4px;
        }
        .lesson-back-btn:hover {
          color: #1e293b;
        }

        .duo-lesson-progress-bar {
          flex: 1;
          height: 14px;
          background: #e2e8f0;
          border-radius: var(--radius-full);
          overflow: hidden;
          position: relative;
        }

        .duo-progress-fill {
          height: 100%;
          background: var(--duo-green);
          border-radius: var(--radius-full);
          transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .lesson-step-counter {
          font-size: 0.88rem;
          font-weight: 800;
          color: #64748b;
        }

        .lesson-mode-bar {
          display: flex;
          background: #ffffff;
          border-bottom: 2px solid #e2e8f0;
          padding: 4px 12px;
          gap: 6px;
          overflow-x: auto;
        }

        .mode-btn {
          flex: 1;
          background: transparent;
          border: none;
          padding: 10px 8px;
          font-size: 0.82rem;
          font-weight: 800;
          color: #64748b;
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
          white-space: nowrap;
        }

        .mode-btn.active {
          color: var(--duo-blue-dark);
          background: var(--duo-blue-light);
        }

        .lesson-content-area {
          padding: 20px 18px;
          flex: 1;
        }

        .concept-single-page {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .concept-hero-card {
          background: #ffffff;
          border: 2px solid #e2e8f0;
          border-radius: var(--radius-lg);
          padding: 24px 20px;
          box-shadow: 0 4px 0 #e2e8f0;
        }

        .concept-badge-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .concept-chip {
          font-size: 0.72rem;
          font-weight: 900;
          color: var(--duo-blue-dark);
          letter-spacing: 0.08em;
          background: var(--duo-blue-light);
          padding: 4px 10px;
          border-radius: var(--radius-full);
        }

        .lesson-time-chip {
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          color: #64748b;
        }

        .concept-main-title {
          font-size: 1.45rem;
          font-weight: 900;
          color: #1e293b;
          line-height: 1.25;
          margin-bottom: 14px;
        }

        .concept-explanation-text {
          font-size: 1rem;
          color: #334155;
          line-height: 1.65;
        }

        /* Callouts */
        .duo-callout-card {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 16px 18px;
          border-radius: var(--radius-md);
          border: 2px solid #fde68a;
          background: #fffbeb;
        }

        .callout-icon-wrap.yellow {
          color: #d97706;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .callout-text strong {
          display: block;
          font-size: 0.88rem;
          color: #92400e;
          font-weight: 800;
          margin-bottom: 2px;
        }

        .callout-text p {
          font-size: 0.92rem;
          color: #78350f;
          line-height: 1.5;
        }

        /* Examples */
        .examples-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 6px;
        }

        .section-label {
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: #64748b;
        }

        .duo-example-card {
          background: #ffffff;
          border: 2px solid #e2e8f0;
          border-radius: var(--radius-md);
          overflow: hidden;
          box-shadow: 0 4px 0 #e2e8f0;
        }

        .example-top-bar {
          background: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .example-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.76rem;
          font-weight: 800;
          color: var(--duo-blue-dark);
        }

        .lang-pill {
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          color: #64748b;
          background: #e2e8f0;
          padding: 2px 8px;
          border-radius: var(--radius-full);
        }

        .code-display {
          background: #0f172a;
          padding: 16px;
          overflow-x: auto;
        }

        .code-display code {
          color: #38bdf8;
          font-family: var(--font-mono);
          font-size: 0.88rem;
          line-height: 1.5;
        }

        .text-display {
          padding: 16px;
        }

        .text-display p {
          font-size: 0.92rem;
          color: #334155;
          line-height: 1.55;
        }

        /* Tradeoffs and Revision styling */
        .section-hero-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 18px;
        }

        .hero-icon-circle {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .hero-icon-circle.red {
          background: var(--duo-red-light);
          color: var(--duo-red);
        }
        .hero-icon-circle.blue {
          background: var(--duo-blue-light);
          color: var(--duo-blue-dark);
        }

        .section-hero-header h2 {
          font-size: 1.25rem;
          font-weight: 900;
          color: #1e293b;
        }
        .section-hero-header p {
          font-size: 0.84rem;
          color: #64748b;
        }

        .tradeoff-cards-list, .revision-cards-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .tradeoff-body {
          min-width: 0;
        }

        /* Flatten content-block chrome inside tradeoff/revision cards —
           the wrapper card already carries the border/shadow */
        .tradeoff-body .content-callout,
        .revision-body .content-callout {
          background: transparent;
          border: none;
          border-left: none;
          padding: 0 8px 0 12px;
          margin: 0;
          border-radius: 0;
        }
        .tradeoff-body .content-paragraph,
        .tradeoff-body .content-callout p,
        .revision-body .content-paragraph,
        .revision-body .content-callout p {
          margin: 0 0 8px 0;
          font-size: 0.9rem;
          line-height: 1.6;
        }
        .tradeoff-body .content-callout strong,
        .revision-body .content-callout strong {
          font-size: 0.92rem;
          margin-bottom: 4px;
        }
        .tradeoff-body .content-paragraph:last-child,
        .tradeoff-body .content-callout p:last-child,
        .revision-body .content-paragraph:last-child,
        .revision-body .content-callout p:last-child {
          margin-bottom: 0;
        }
        /* Subheadings & rich blocks (code/table/steps) keep their look,
           just with tightened spacing inside the wrapper card */
        .tradeoff-body .content-subheading,
        .revision-body .content-subheading {
          margin: 12px 0 4px 0;
          font-size: 0.95rem;
        }
        .tradeoff-body .content-callout,
        .revision-body .content-callout {
          border-left: none;
        }
        .tradeoff-body > .content-code,
        .tradeoff-body > .content-table-wrap,
        .tradeoff-body > .content-steps,
        .revision-body > .content-code,
        .revision-body > .content-table-wrap,
        .revision-body > .content-steps {
          margin: 10px 0 0 0;
        }

        .tradeoff-box {
          background: #ffffff;
          border: 2px solid #fecaca;
          border-radius: var(--radius-md);
          padding: 14px 16px 16px 16px;
          box-shadow: 0 4px 0 #fee2e2;
          overflow: hidden;
        }

        .tradeoff-top-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        .tradeoff-marker {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: var(--duo-red-light);
          color: var(--duo-red);
          border: 2px solid #fecaca;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .tradeoff-num {
          font-weight: 900;
          font-size: 0.95rem;
        }

        .tradeoff-eyebrow {
          font-size: 0.66rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: var(--duo-red);
          text-transform: uppercase;
        }

        .tradeoff-footnote {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
          padding: 12px 14px;
          background: #fef2f2;
          border: 1.5px dashed #fca5a5;
          border-radius: var(--radius-md);
          font-size: 0.78rem;
          font-weight: 700;
          color: #b91c1c;
          line-height: 1.4;
        }
        .tradeoff-footnote svg { flex-shrink: 0; }

        .tradeoff-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 44px 20px;
          text-align: center;
          color: #f87171;
          background: #fff5f5;
          border: 2px dashed #fecaca;
          border-radius: var(--radius-lg);
        }
        .tradeoff-empty p { font-size: 0.88rem; color: #64748b; font-weight: 700; max-width: 260px; }
        .tradeoff-empty.blue { color: #60a5fa; background: #eff6ff; border-color: #bfdbfe; }

        .revision-progress-strip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          align-self: flex-start;
          margin-bottom: 12px;
          padding: 5px 11px;
          background: var(--duo-blue-light);
          border: 1.5px solid #bfdbfe;
          border-radius: var(--radius-full);
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--duo-blue-dark);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .revision-progress-strip svg { flex-shrink: 0; }

        .revision-box {
          background: #ffffff;
          border: 2px solid #e2e8f0;
          border-radius: var(--radius-md);
          padding: 14px 16px 16px 16px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          box-shadow: 0 4px 0 #e2e8f0;
        }

        .rev-check-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--duo-green-bg);
          color: var(--duo-green-dark);
          border: 2px solid #a7f3d0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .rev-check {
          font-weight: 900;
          font-size: 0.95rem;
        }

        .revision-body {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .revision-eyebrow {
          font-size: 0.66rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: var(--duo-green-dark);
          text-transform: uppercase;
        }

        .revision-quiz-cta {
          width: 100%;
          margin-top: 16px;
        }

        /* Footer */
        .lesson-footer-bar {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 480px;
          background: #ffffff;
          border-top: 2px solid #e2e8f0;
          padding: 16px 20px;
          z-index: 50;
        }

        .pagination-action-row {
          display: flex;
          gap: 12px;
        }

        .nav-arrow-btn {
          width: 54px;
          padding: 0;
          flex-shrink: 0;
        }

        .next-concept-btn {
          flex: 1;
          justify-content: space-between;
        }

        .full-action-btn {
          width: 100%;
        }
      `}</style>
    </div>
  );
}

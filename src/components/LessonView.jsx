import React, { useState } from 'react';
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
  onBack,
  onStartQuiz,
  onOpenScenario
}) {
  const [conceptIndex, setConceptIndex] = useState(0);
  const [viewMode, setViewMode] = useState('concept'); // 'concept' | 'tradeoffs' | 'revision'

  if (!lesson) {
    return (
      <div className="p-6 text-center">
        <p>Lesson not found.</p>
        <button className="btn btn-secondary mt-4" onClick={onBack}>Go Back</button>
      </div>
    );
  }

  const concepts = lesson.concepts || [];
  const currentConcept = concepts[conceptIndex] || concepts[0];
  const totalConcepts = concepts.length;
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
              <div className="concept-explanation-text">
                {currentConcept.blocks?.filter(block => block.type === 'paragraph').length === 0 && <p>{currentConcept.title}</p>}
              </div>
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

            <div className="tradeoff-cards-list">
              {lesson.tradeoffsAndPitfalls?.map((item, idx) => (
                <div key={idx} className="tradeoff-box">
                  <span className="tradeoff-num">{idx + 1}</span>
                  <ContentBlock block={item} />
                </div>
              ))}
            </div>
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

            <div className="revision-cards-list">
              {lesson.revisionSheet?.map((note, idx) => (
                <div key={idx} className="revision-box">
                  <div className="rev-check">✓</div>
                  <ContentBlock block={note} />
                </div>
              ))}
            </div>
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

        .tradeoff-box {
          background: #ffffff;
          border: 2px solid #fecaca;
          border-left: 6px solid var(--duo-red);
          border-radius: var(--radius-md);
          padding: 16px;
          display: flex;
          gap: 12px;
          box-shadow: 0 4px 0 #fee2e2;
        }

        .tradeoff-num {
          font-weight: 900;
          color: var(--duo-red);
          font-size: 0.95rem;
        }

        .tradeoff-text {
          font-size: 0.92rem;
          color: #334155;
          line-height: 1.55;
        }

        .revision-box {
          background: #ffffff;
          border: 2px solid #e2e8f0;
          border-radius: var(--radius-md);
          padding: 16px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          box-shadow: 0 4px 0 #e2e8f0;
        }

        .rev-check {
          color: var(--duo-green-dark);
          font-weight: 900;
          font-size: 1.1rem;
          flex-shrink: 0;
        }

        .revision-text {
          font-size: 0.92rem;
          color: #334155;
          line-height: 1.55;
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

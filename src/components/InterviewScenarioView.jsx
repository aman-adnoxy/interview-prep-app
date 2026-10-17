import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Briefcase, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles
} from 'lucide-react';
import { sound } from '../services/sound';

export default function InterviewScenarioView({
  scenarios = [],
  onBack
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [userDrafts, setUserDrafts] = useState({});
  const [revealed, setRevealed] = useState({});

  if (!scenarios || scenarios.length === 0) {
    return (
      <div className="p-6 text-center">
        <p>No interview scenarios available.</p>
        <button className="btn btn-secondary mt-4" onClick={onBack}>Go Back</button>
      </div>
    );
  }

  const scenario = scenarios[activeIdx] || scenarios[0];
  const sId = scenario.id || `scenario-${activeIdx}`;
  const isRevealed = !!revealed[sId];
  const userText = userDrafts[sId] || '';

  return (
    <div className="duo-scenario-page animate-slide-up">
      {/* Top Header */}
      <header className="scenario-top-bar">
        <button 
          className="scenario-back-btn" 
          onClick={() => { sound.playTap(); onBack(); }}
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </button>
        <div>
          <span className="scenario-sub-tag">STAFF INTERVIEW PRACTICE</span>
          <h2 className="scenario-nav-title">Engineering Diagnostic Case</h2>
        </div>
      </header>

      <main className="scenario-content-body">
        {/* Scenario Carousel if multiple */}
        {scenarios.length > 1 && (
          <div className="scenario-tabs-row">
            {scenarios.map((sc, i) => (
              <button
                key={sc.id || i}
                className={`case-tab-btn ${activeIdx === i ? 'active' : ''}`}
                onClick={() => { sound.playTap(); setActiveIdx(i); }}
              >
                Case #{i + 1}
              </button>
            ))}
          </div>
        )}

        {/* Prompt Card */}
        <div className="case-prompt-card">
          <div className="case-badge-row">
            <span className="case-badge">
              <Briefcase size={14} />
              <span>Real-World Scenario</span>
            </span>
          </div>

          <h3 className="case-prompt-text">{scenario.prompt}</h3>

          {scenario.skillsTested && (
            <div className="skills-wrap">
              <span className="skills-label">SKILLS EVALUATED:</span>
              <div className="chips-list">
                {scenario.skillsTested.map((skill, idx) => (
                  <span key={idx} className="skill-chip">{skill}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User response draft */}
        <div className="user-draft-card">
          <div className="draft-header">
            <h4>Your Interview Answer</h4>
            <p>Outline how you would reason through this diagnostic in an interview:</p>
          </div>

          <textarea
            className="draft-input"
            rows={5}
            placeholder="e.g. 1. Check EXPLAIN ANALYZE for estimated vs actual rows, 2. Verify selectivity, 3. Check for sequential scan triggers..."
            value={userText}
            onChange={(e) => setUserDrafts({ ...userDrafts, [sId]: e.target.value })}
          />

          {!isRevealed ? (
            <button
              className="btn btn-primary reveal-btn"
              onClick={() => { sound.playTap(); setRevealed({ ...revealed, [sId]: true }); }}
            >
              <Eye size={18} />
              <span>Reveal Reference Answer</span>
            </button>
          ) : (
            <button
              className="btn btn-secondary reveal-btn"
              onClick={() => { sound.playTap(); setRevealed({ ...revealed, [sId]: false }); }}
            >
              <EyeOff size={18} />
              <span>Hide Reference Answer</span>
            </button>
          )}
        </div>

        {/* Reference Solution */}
        {isRevealed && (
          <div className="reference-stack animate-slide-up">
            {/* Strong Answer Points */}
            <div className="solution-card">
              <div className="card-heading-row">
                <CheckCircle2 size={20} className="icon-green" />
                <h4>Points Expected in a Strong Answer</h4>
              </div>
              <ul className="points-bullet-list">
                {scenario.strongAnswerPoints?.map((pt, i) => (
                  <li key={i} className="bullet-point-item">
                    <span className="bullet-check">✓</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Staff-Level Answer */}
            <div className="solution-card staff-ans">
              <div className="card-heading-row">
                <Sparkles size={20} className="icon-gold" />
                <h4>Staff Reference Explanation</h4>
              </div>
              <div className="reference-box">
                <p>{scenario.referenceAnswer}</p>
              </div>
            </div>

            {/* Common Pitfalls */}
            {scenario.pitfalls && scenario.pitfalls.length > 0 && (
              <div className="solution-card pitfalls">
                <div className="card-heading-row">
                  <AlertTriangle size={20} className="icon-red" />
                  <h4>Common Mistakes & Misconceptions</h4>
                </div>
                <ul className="points-bullet-list">
                  {scenario.pitfalls.map((pf, i) => (
                    <li key={i} className="bullet-point-item">
                      <span className="bullet-cross">✕</span>
                      <span>{pf}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        .duo-scenario-page {
          background: #f7f9fa;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          padding-bottom: 40px;
        }

        .scenario-top-bar {
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

        .scenario-back-btn {
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 4px;
        }

        .scenario-sub-tag {
          font-size: 0.68rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: var(--duo-blue-dark);
          display: block;
        }

        .scenario-nav-title {
          font-size: 1.15rem;
          font-weight: 900;
          color: #1e293b;
        }

        .scenario-content-body {
          padding: 20px 18px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .case-prompt-card {
          background: #ffffff;
          border: 2px solid #e2e8f0;
          border-radius: var(--radius-lg);
          padding: 22px 18px;
          box-shadow: 0 4px 0 #e2e8f0;
        }

        .case-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          font-weight: 900;
          color: var(--duo-blue-dark);
          background: var(--duo-blue-light);
          padding: 4px 10px;
          border-radius: var(--radius-full);
          margin-bottom: 12px;
        }

        .case-prompt-text {
          font-size: 1.25rem;
          font-weight: 800;
          color: #1e293b;
          line-height: 1.4;
          margin-bottom: 16px;
        }

        .skills-wrap {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .skills-label {
          font-size: 0.7rem;
          font-weight: 900;
          color: #94a3b8;
          letter-spacing: 0.06em;
        }

        .chips-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .skill-chip {
          background: #f1f5f9;
          border: 1.5px solid #e2e8f0;
          color: #475569;
          font-size: 0.76rem;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: var(--radius-full);
        }

        .user-draft-card {
          background: #ffffff;
          border: 2px solid #e2e8f0;
          border-radius: var(--radius-lg);
          padding: 20px 18px;
          box-shadow: 0 4px 0 #e2e8f0;
        }

        .draft-header h4 {
          font-size: 1.05rem;
          font-weight: 900;
          color: #1e293b;
          margin-bottom: 2px;
        }

        .draft-header p {
          font-size: 0.84rem;
          color: #64748b;
          margin-bottom: 12px;
        }

        .draft-input {
          width: 100%;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: var(--radius-md);
          padding: 12px 14px;
          font-family: inherit;
          font-size: 0.92rem;
          color: #1e293b;
          line-height: 1.5;
          outline: none;
          resize: vertical;
          margin-bottom: 14px;
        }
        .draft-input:focus {
          border-color: var(--duo-blue);
          background: #ffffff;
        }

        .reveal-btn {
          width: 100%;
        }

        .reference-stack {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .solution-card {
          background: #ffffff;
          border: 2px solid #e2e8f0;
          border-radius: var(--radius-lg);
          padding: 20px 18px;
          box-shadow: 0 4px 0 #e2e8f0;
        }

        .card-heading-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }

        .card-heading-row h4 {
          font-size: 1rem;
          font-weight: 900;
          color: #1e293b;
        }

        .icon-green { color: var(--duo-green-dark); }
        .icon-gold { color: #d97706; }
        .icon-red { color: var(--duo-red); }

        .points-bullet-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .bullet-point-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 0.9rem;
          color: #334155;
          line-height: 1.5;
        }

        .bullet-check {
          color: var(--duo-green-dark);
          font-weight: 900;
        }
        .bullet-cross {
          color: var(--duo-red);
          font-weight: 900;
        }

        .reference-box {
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: var(--radius-md);
          padding: 14px 16px;
        }
        .reference-box p {
          font-size: 0.92rem;
          color: #1e293b;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}

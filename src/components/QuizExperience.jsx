import React, { useState } from 'react';
import { 
  X, 
  Check, 
  ArrowRight, 
  Lightbulb, 
  Heart 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../services/sound';
import { evaluateAnswer } from '../services/quiz';

export default function QuizExperience({
  questions = [],
  onFinishQuiz,
  onExit
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submittedStates, setSubmittedStates] = useState({});
  const [showHint, setShowHint] = useState(false);
  const [userAnswersRecord, setUserAnswersRecord] = useState([]);
  const [lives, setLives] = useState(5);

  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  if (!currentQ) {
    return (
      <div className="p-6 text-center">
        <p>No questions in this section.</p>
        <button className="btn btn-secondary mt-4" onClick={onExit}>Exit</button>
      </div>
    );
  }

  const qId = currentQ.id;
  const isSubmitted = !!submittedStates[qId];
  const userSelection = selectedAnswers[qId];

  const isCorrect = isSubmitted ? evaluateAnswer(currentQ, userSelection) : false;

  const handleSelectOption = (optionId) => {
    if (isSubmitted) return;
    sound.playTap();

    if (currentQ.type === 'single_select') {
      setSelectedAnswers({ ...selectedAnswers, [qId]: optionId });
    } else if (currentQ.type === 'true_false') {
      setSelectedAnswers({ ...selectedAnswers, [qId]: optionId });
    } else if (currentQ.type === 'multi_select') {
      const current = selectedAnswers[qId] || [];
      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      setSelectedAnswers({ ...selectedAnswers, [qId]: next });
    }
  };

  const hasSelection = () => {
    if (userSelection === undefined || userSelection === null) return false;
    if (currentQ.type === 'multi_select') return Array.isArray(userSelection) && userSelection.length > 0;
    return true;
  };

  const handleSubmitAnswer = () => {
    if (!hasSelection() || isSubmitted) return;

    setSubmittedStates({ ...submittedStates, [qId]: true });

    const correct = evaluateAnswer(currentQ, userSelection);

    if (correct) {
      sound.playCorrect();
      try {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#58cc02', '#1cb0f6', '#ffc800']
        });
      } catch {}
    } else {
      sound.playIncorrect();
      setLives((prev) => Math.max(1, prev - 1));
    }

    const updatedRecord = [
      ...userAnswersRecord.filter((r) => r.questionId !== qId),
      {
        questionId: qId,
        questionPrompt: currentQ.prompt,
        userAnswer: userSelection,
        correct,
        type: currentQ.type,
        explanation: currentQ.explanation
      }
    ];
    setUserAnswersRecord(updatedRecord);
  };

  const handleNextOrFinish = () => {
    sound.playTap();
    if (!isLastQuestion) {
      setCurrentIndex((prev) => prev + 1);
      setShowHint(false);
    } else {
      sound.playComplete();
      const finalRecord = userAnswersRecord;
      const score = finalRecord.filter((r) => r.correct).length;
      onFinishQuiz({
        score,
        total: totalQuestions,
        records: finalRecord
      });
    }
  };

  const progressPercent = ((currentIndex + (isSubmitted ? 1 : 0)) / totalQuestions) * 100;

  return (
    <div className="duo-quiz-page animate-slide-up">
      {/* Header Bar */}
      <header className="quiz-top-bar">
        <button 
          className="quiz-exit-btn" 
          onClick={() => { sound.playTap(); onExit(); }}
          aria-label="Exit Quiz"
        >
          <X size={24} />
        </button>

        <div className="quiz-progress-track">
          <div 
            className="quiz-progress-fill" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="hearts-display">
          <Heart size={20} fill="#ff4b4b" className="heart-icon" />
          <span className="heart-number">{lives}</span>
        </div>
      </header>

      {/* Main Quiz Area */}
      <main className="quiz-main-content">
        {/* Mascot + Speech Bubble Prompt */}
        <div className="mascot-speech-container">
          <div className="mascot-avatar">
            <span role="img" aria-label="owl" className="owl-emoji">🦉</span>
          </div>

          <div className="speech-bubble">
            <div className="speech-tag">
              {currentQ.type === 'multi_select' ? 'Select all that apply' : 
               currentQ.type === 'true_false' ? 'True or False' : 'Select the best answer'}
            </div>
            <h2 className="speech-prompt">{currentQ.prompt}</h2>
          </div>
        </div>

        {/* Optional Hint Button */}
        {currentQ.hint && (
          <div className="quiz-hint-wrap">
            {!showHint ? (
              <button className="btn-show-hint" onClick={() => { sound.playTap(); setShowHint(true); }}>
                <Lightbulb size={16} />
                <span>Show Hint</span>
              </button>
            ) : (
              <div className="hint-card-body">
                <Lightbulb size={18} className="hint-bulb" />
                <p>{currentQ.hint}</p>
              </div>
            )}
          </div>
        )}

        {/* Options List */}
        <div className="duo-options-container">
          {currentQ.type === 'true_false' ? (
            [true, false].map((val) => {
              const isSelected = userSelection === val;
              let status = '';
              if (isSubmitted) {
                if (val === currentQ.correctAnswer) status = 'correct';
                else if (isSelected) status = 'wrong';
              } else if (isSelected) {
                status = 'selected';
              }

              return (
                <button
                  key={val ? 'true' : 'false'}
                  className={`duo-card-option ${status}`}
                  onClick={() => handleSelectOption(val)}
                  disabled={isSubmitted}
                >
                  <div className="opt-key-chip">{val ? 'T' : 'F'}</div>
                  <span className="opt-text">{val ? 'True' : 'False'}</span>
                  {isSubmitted && val === currentQ.correctAnswer && (
                    <Check size={22} className="opt-icon correct" />
                  )}
                  {isSubmitted && isSelected && val !== currentQ.correctAnswer && (
                    <X size={22} className="opt-icon wrong" />
                  )}
                </button>
              );
            })
          ) : (
            currentQ.options?.map((opt, optIdx) => {
              const isSelected = currentQ.type === 'multi_select'
                ? Array.isArray(userSelection) && userSelection.includes(opt.id)
                : userSelection === opt.id;

              let status = '';
              if (isSubmitted) {
                const isCorrectOption = currentQ.type === 'multi_select'
                  ? currentQ.correctOptionIds?.includes(opt.id)
                  : opt.id === currentQ.correctOptionId;

                if (isCorrectOption) status = 'correct';
                else if (isSelected) status = 'wrong';
              } else if (isSelected) {
                status = 'selected';
              }

              return (
                <button
                  key={opt.id}
                  className={`duo-card-option ${status}`}
                  onClick={() => handleSelectOption(opt.id)}
                  disabled={isSubmitted}
                >
                  <div className="opt-key-chip">{String.fromCharCode(65 + optIdx)}</div>
                  <span className="opt-text">{opt.text}</span>
                  {isSubmitted && (
                    (currentQ.type === 'multi_select' ? currentQ.correctOptionIds?.includes(opt.id) : opt.id === currentQ.correctOptionId) ? (
                      <Check size={22} className="opt-icon correct" />
                    ) : isSelected ? (
                      <X size={22} className="opt-icon wrong" />
                    ) : null
                  )}
                </button>
              );
            })
          )}
        </div>
      </main>

      {/* FEEDBACK DRAWER: Light Duolingo Green & Red Drawers */}
      {isSubmitted && (
        <div className={`duo-bottom-drawer ${isCorrect ? 'drawer-correct' : 'drawer-wrong'} animate-slide-up`}>
          <div className="drawer-header-row">
            <div className="drawer-status-icon">
              {isCorrect ? <Check size={28} /> : <X size={28} />}
            </div>
            <div>
              <h3 className="drawer-status-title">
                {isCorrect ? 'Nicely done!' : 'Correct solution:'}
              </h3>
              <span className="drawer-status-sub">
                {isCorrect ? 'You understand this database index concept.' : 'Review the reasoning below.'}
              </span>
            </div>
          </div>

          <div className="drawer-explanation-box">
            <p>{currentQ.explanation}</p>
          </div>

          <button 
            className={`btn duo-drawer-btn ${isCorrect ? 'btn-primary' : 'btn-red'}`}
            onClick={handleNextOrFinish}
          >
            <span>{isLastQuestion ? 'COMPLETE QUIZ' : 'CONTINUE'}</span>
            <ArrowRight size={20} />
          </button>
        </div>
      )}

      {/* Default Check button */}
      {!isSubmitted && (
        <div className="quiz-bottom-dock">
          <button
            className="btn btn-primary duo-check-btn"
            disabled={!hasSelection()}
            onClick={handleSubmitAnswer}
          >
            CHECK
          </button>
        </div>
      )}

      <style>{`
        .duo-quiz-page {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: #f7f9fa;
          padding-bottom: 120px;
        }

        .quiz-top-bar {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 20px;
          background: #ffffff;
          border-bottom: 2px solid #e2e8f0;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .quiz-exit-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
        }
        .quiz-exit-btn:hover {
          color: #1e293b;
        }

        .quiz-progress-track {
          flex: 1;
          height: 14px;
          background: #e2e8f0;
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .quiz-progress-fill {
          height: 100%;
          background: var(--duo-green);
          border-radius: var(--radius-full);
          transition: width 0.3s ease;
        }

        .hearts-display {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .heart-icon { color: #ff4b4b; }

        .heart-number {
          font-size: 1.1rem;
          font-weight: 900;
          color: #ff4b4b;
        }

        .quiz-main-content {
          padding: 24px 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        /* Mascot Row */
        .mascot-speech-container {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 24px;
        }

        .mascot-avatar {
          width: 54px;
          height: 54px;
          border-radius: 16px;
          background: #ecfdf5;
          border: 2px solid #a7f3d0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 0 #a7f3d0;
        }

        .owl-emoji {
          font-size: 2rem;
        }

        .speech-bubble {
          flex: 1;
          background: #ffffff;
          border: 2px solid #e2e8f0;
          border-radius: 6px 20px 20px 20px;
          padding: 16px 18px;
          box-shadow: 0 4px 0 #e2e8f0;
        }

        .speech-tag {
          font-size: 0.68rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--duo-blue-dark);
          margin-bottom: 4px;
        }

        .speech-prompt {
          font-size: 1.18rem;
          font-weight: 900;
          color: #1e293b;
          line-height: 1.35;
        }

        /* Hint */
        .quiz-hint-wrap {
          margin-bottom: 20px;
        }

        .btn-show-hint {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #fffbeb;
          border: 2px solid #fde68a;
          color: #b45309;
          padding: 6px 14px;
          border-radius: var(--radius-full);
          font-size: 0.8rem;
          font-weight: 800;
          cursor: pointer;
        }

        .hint-card-body {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: #fffbeb;
          border: 2px solid #fde68a;
          border-radius: var(--radius-md);
          padding: 12px 16px;
          font-size: 0.88rem;
          color: #78350f;
          line-height: 1.5;
        }

        .hint-bulb {
          color: #d97706;
          flex-shrink: 0;
          margin-top: 2px;
        }

        /* Options */
        .duo-options-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .duo-card-option {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 18px;
          border-radius: var(--radius-md);
          background: #ffffff;
          border: 2px solid #e2e8f0;
          box-shadow: 0 4px 0 #e2e8f0;
          color: #1e293b;
          cursor: pointer;
          text-align: left;
          transition: all 0.1s ease-in-out;
          outline: none;
        }

        .duo-card-option:hover:not(:disabled) {
          border-color: #cbd5e1;
          transform: translateY(-2px);
          box-shadow: 0 6px 0 #cbd5e1;
        }

        .duo-card-option:active:not(:disabled) {
          transform: translateY(4px);
          box-shadow: 0 0 0 #cbd5e1;
        }

        .opt-key-chip {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: #f1f5f9;
          border: 1.5px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.88rem;
          font-weight: 900;
          color: #64748b;
          flex-shrink: 0;
        }

        .opt-text {
          font-size: 1rem;
          font-weight: 700;
          line-height: 1.45;
          flex: 1;
        }

        /* Selected */
        .duo-card-option.selected {
          border-color: #84cc16 !important;
          background: #f7fee7 !important;
          box-shadow: 0 4px 0 #65a30d !important;
        }
        .duo-card-option.selected .opt-key-chip {
          background: #84cc16;
          color: #ffffff;
          border-color: #65a30d;
        }

        /* Correct */
        .duo-card-option.correct {
          border-color: var(--duo-green) !important;
          background: #ecfdf5 !important;
          box-shadow: 0 4px 0 var(--duo-green-dark) !important;
        }
        .duo-card-option.correct .opt-key-chip {
          background: var(--duo-green);
          color: #ffffff;
          border-color: var(--duo-green-dark);
        }

        /* Wrong */
        .duo-card-option.wrong {
          border-color: var(--duo-red) !important;
          background: #fff1f2 !important;
          box-shadow: 0 4px 0 var(--duo-red-dark) !important;
        }
        .duo-card-option.wrong .opt-key-chip {
          background: var(--duo-red);
          color: #ffffff;
          border-color: var(--duo-red-dark);
        }

        .opt-icon.correct { color: var(--duo-green-dark); flex-shrink: 0; }
        .opt-icon.wrong { color: var(--duo-red); flex-shrink: 0; }

        /* Bottom Drawer */
        .duo-bottom-drawer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          width: 100%;
          max-width: 480px;
          margin: 0 auto;
          max-height: 80vh;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 18px 20px 22px 20px;
          border-radius: 24px 24px 0 0;
          z-index: 60;
          box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
        }

        .drawer-correct {
          background: #d7ffb8;
          border-top: 4px solid var(--duo-green);
        }

        .drawer-wrong {
          background: #ffdfe0;
          border-top: 4px solid var(--duo-red);
        }

        .drawer-header-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }

        .drawer-status-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          flex-shrink: 0;
        }
        .drawer-correct .drawer-status-icon { color: var(--duo-green-dark); }
        .drawer-wrong .drawer-status-icon { color: var(--duo-red-dark); }

        .drawer-status-title {
          font-size: 1.25rem;
          font-weight: 900;
          line-height: 1.2;
        }
        .drawer-correct .drawer-status-title { color: #166534; }
        .drawer-wrong .drawer-status-title { color: #991b1b; }

        .drawer-status-sub {
          font-size: 0.8rem;
          color: #475569;
        }

        .drawer-explanation-box {
          background: #ffffff;
          border-radius: var(--radius-sm);
          padding: 12px 14px;
          margin-bottom: 14px;
          border: 2px solid rgba(0, 0, 0, 0.06);
          max-height: 38vh;
          overflow-y: auto;
        }

        .drawer-explanation-box p {
          font-size: 0.88rem;
          color: #334155;
          line-height: 1.5;
        }

        .duo-drawer-btn {
          width: 100%;
          padding: 14px;
          font-size: 1rem;
          flex-shrink: 0;
        }

        .btn-red {
          background-color: var(--duo-red);
          color: #ffffff;
          box-shadow: 0 4px 0 var(--duo-red-dark);
        }
        .btn-red:hover {
          background-color: #ff3333;
          transform: translateY(-2px);
          box-shadow: 0 6px 0 var(--duo-red-dark);
        }
        .btn-red:active {
          transform: translateY(4px);
          box-shadow: 0 0 0 var(--duo-red-dark);
        }

        .quiz-bottom-dock {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 480px;
          padding: 16px 20px;
          background: #ffffff;
          border-top: 2px solid #e2e8f0;
          z-index: 50;
        }

        .duo-check-btn {
          width: 100%;
          padding: 16px;
          font-size: 1.05rem;
        }

        @media (max-height: 700px) {
          .duo-bottom-drawer {
            padding: 14px 16px 18px 16px;
            max-height: 85vh;
          }
          .drawer-explanation-box {
            max-height: 28vh;
            padding: 10px 12px;
            margin-bottom: 10px;
          }
          .drawer-header-row {
            margin-bottom: 8px;
          }
          .drawer-status-title {
            font-size: 1.15rem;
          }
        }
      `}</style>
    </div>
  );
}

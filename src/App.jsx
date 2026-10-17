import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DailyAssignmentCard from './components/DailyAssignmentCard';
import TracksOverview from './components/TracksOverview';
import TopicLearningPath from './components/TopicLearningPath';
import LessonView from './components/LessonView';
import QuizExperience from './components/QuizExperience';
import CompletionSummary from './components/CompletionSummary';
import InterviewScenarioView from './components/InterviewScenarioView';
import HistoryModal from './components/HistoryModal';
import SettingsModal from './components/SettingsModal';

import { fetchManifest, fetchLesson, resolveActiveAssignment, getTodayKolkataString, computeStreak } from './services/api';
import { 
  getAllProgress, 
  saveSectionProgress, 
  recordQuizAttempt,
  getAllQuizAttempts,
  getPreferences,
  clearAllProgress 
} from './services/storage';
import { sound } from './services/sound';

// Remembers which lesson the learner is currently on so a refresh resumes there
const LAST_SECTION_KEY = 'interview_prep_last_section';

function findSectionInManifest(manifestData, sectionId) {
  if (!manifestData?.topics || !sectionId) return null;
  for (const topic of manifestData.topics) {
    const match = (topic.sections || []).find((section) => section.id === sectionId);
    if (match) return { ...match, topicId: topic.id, topicTitle: topic.title };
  }
  return null;
}

export default function App() {
  const [manifest, setManifest] = useState(null);
  const [progressMap, setProgressMap] = useState({});
  const [activeSection, setActiveSection] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);

  // Selected topic for dedicated topic learning path page
  const [selectedTopic, setSelectedTopic] = useState(null);

  // Navigation states: 'home' | 'tracks' | 'topic-path' | 'lesson' | 'quiz' | 'summary' | 'scenario'
  const [viewState, setViewState] = useState('home');
  // Header tabs: 'assignment' | 'curriculum'
  const [activeTab, setActiveTab] = useState('assignment');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastQuizResult, setLastQuizResult] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [streak, setStreak] = useState(0);

  // Modals state (declared at top before any conditional return)
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    async function initApp() {
      try {
        setLoading(true);
        const [manifestData, storedProgress, storedAttempts] = await Promise.all([
          fetchManifest(),
          getAllProgress(),
          getAllQuizAttempts(),
        ]);

        // Honor persisted sound preference before any interaction needs audio
        sound.setEnabled(getPreferences().sound !== false);

        setManifest(manifestData);
        setProgressMap(storedProgress || {});
        setQuizAttempts(storedAttempts || []);
        setStreak(computeStreak(storedAttempts));

        // Start at the first incomplete section, or resume the lesson the
        // learner was last viewing if it is still incomplete
        let startedSection = resolveActiveAssignment(manifestData, storedProgress || {});
        try {
          const lastSectionId = localStorage.getItem(LAST_SECTION_KEY);
          const lastSection = findSectionInManifest(manifestData, lastSectionId);
          if (lastSection && lastSection.status === 'published'
            && !(storedProgress || {})[lastSection.id]?.completed
            && startedSection?.id !== lastSection.id) {
            startedSection = lastSection;
          }
        } catch {
          // localStorage unavailable; fall back to the next incomplete section
        }
        setActiveSection(startedSection);

        // Preload lesson for active section
        if (startedSection?.lessonId || startedSection?.id) {
          try {
            const lessonData = await fetchLesson(startedSection.lessonId || startedSection.id);
            setCurrentLesson(lessonData);
          } catch (e) {
            console.error('Failed to preload active lesson', e);
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Failed to load curriculum manifest. Please verify your connection.');
      } finally {
        setLoading(false);
      }
    }

    initApp();
  }, []);

  // Load lesson when user selects or changes active section
  const loadSectionContent = async (section) => {
    if (!section?.lessonPath) {
      setCurrentLesson(null);
      return null;
    }
    // If the currently loaded lesson already matches this section, don't refetch
    if (currentLesson && currentLesson.id === (section.lessonId || section.id)) {
      return currentLesson;
    }
    try {
      setLoading(true);
      const lessonData = await fetchLesson(section.lessonId || section.id);
      setCurrentLesson(lessonData);
      return lessonData;
    } catch (err) {
      console.error('Failed to load lesson content', err);
      setError(`Failed to load ${section.title}.`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Opens a section, marks it as the learner's current lesson, and navigates
  const openSection = async (section, view) => {
    if (!section) return;
    sound.playTap();
    setActiveSection(section);
    try {
      if (section?.id) localStorage.setItem(LAST_SECTION_KEY, section.id);
    } catch {
      // localStorage unavailable; in-session state still works
    }
    await loadSectionContent(section);
    setViewState(view);
  };

  const handleSelectTopic = (topic) => {
    sound.playTap();
    setSelectedTopic(topic);
    setViewState('topic-path');
  };

  const handleSelectSectionFromPath = (section) => openSection(section, 'lesson');

  const handleStartLesson = () => openSection(homeSection, 'lesson');

  const handleStartQuiz = () => openSection(homeSection, 'quiz');

  const handleOpenScenario = () => openSection(homeSection, 'scenario');

  const handleFinishQuiz = async (results) => {
    const { score, total, records } = results;
    setLastQuizResult(results);

    const sectionId = activeSection?.id || currentLesson?.sectionId;
    if (sectionId) {
      const isPassed = score / total >= 0.75;
      const existingProg = progressMap[sectionId] || {};
      const bestScore = Math.max(existingProg.bestScore ?? 0, score);
      const isFirstPass = !existingProg.completed && isPassed;
      
      const updatedProg = {
        sectionId,
        completed: existingProg.completed || isPassed,
        lastScore: score,
        bestScore,
        totalQuestions: total,
        attemptsCount: (existingProg.attemptsCount || 0) + 1,
        lastAttemptDate: new Date().toISOString(),
        ...(isFirstPass ? { completedDate: getTodayKolkataString() } : {})
      };

      const saved = await saveSectionProgress(updatedProg);
      if (!saved) {
        console.warn('Could not persist progress to IndexedDB');
      }
      await recordQuizAttempt({
        sectionId,
        score,
        total,
        records
      });

      // Include the just-recorded attempt so the streak reflects today's activity
      const updatedAttempts = [
        ...quizAttempts,
        { sectionId, timestamp: new Date().toISOString() }
      ];
      setQuizAttempts(updatedAttempts);
      setStreak(computeStreak(updatedAttempts));

      const newMap = { ...progressMap, [sectionId]: updatedProg };
      setProgressMap(newMap);

      // Do NOT preemptively overwrite currentLesson or activeSection here!
      // This preserves the completed lesson and results throughout the CompletionSummary screen
      // so "Review Lesson" opens the lesson the user just completed.
    }

    setViewState('summary');
  };

  const handleResetProgress = async () => {
    await clearAllProgress();
    try {
      localStorage.removeItem(LAST_SECTION_KEY);
    } catch {
      // localStorage unavailable; nothing persisted to clear
    }
    const emptied = {};
    setProgressMap(emptied);
    setActiveSection(resolveActiveAssignment(manifest, emptied));
    setSelectedTopic(null);
    setViewState('home');
    setActiveTab('assignment');
    setLastQuizResult(null);
    // History is stored alongside progress attempts
    setQuizAttempts([]);
    setStreak(0);
  };

  const handleDoneSummary = async () => {
    sound.playTap();
    // Resolve next active section only upon leaving the summary screen
    const nextAssignment = resolveActiveAssignment(manifest, progressMap);
    if (nextAssignment && nextAssignment.id !== activeSection?.id) {
      setActiveSection(nextAssignment);
      try {
        localStorage.setItem(LAST_SECTION_KEY, nextAssignment.id);
      } catch {
        // localStorage unavailable; in-session state still works
      }
      if (nextAssignment.lessonId || nextAssignment.id) {
        await loadSectionContent(nextAssignment);
      }
    }
    setViewState(selectedTopic ? 'topic-path' : 'home');
  };

  const completedCount = Object.values(progressMap).filter((p) => p.completed).length;

  // The home card always reflects live progress:
  // - the lesson the learner is currently on (incomplete), or
  // - the next incomplete section after one was just completed
  const activeAssignment = manifest ? resolveActiveAssignment(manifest, progressMap) : null;
  const homeSection = (activeSection && activeSection.status === 'published'
    && !progressMap[activeSection.id]?.completed)
    ? activeSection
    : activeAssignment;

  if (loading && !manifest) {
    return (
      <div className="app-loader">
        <div className="loader-spinner"></div>
        <p className="loader-text">Loading curriculum...</p>
        <style>{`
          .app-loader {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            gap: 16px;
          }
          .loader-spinner {
            width: 44px;
            height: 44px;
            border: 4px solid #1e293b;
            border-top-color: #6366f1;
            border-radius: 50%;
            animation: spin 0.7s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .loader-text {
            color: #94a3b8;
            font-size: 0.95rem;
            font-weight: 700;
          }
        `}</style>
      </div>
    );
  }

  if (error && !manifest) {
    return (
      <div className="app-loader">
        <div style={{ fontSize: '3rem' }}>⚠️</div>
        <h2 style={{ color: '#ef4444', fontWeight: 900, margin: '8px 0' }}>Data Loading Error</h2>
        <p style={{ color: '#64748b', maxWidth: '380px', textAlign: 'center', lineHeight: 1.5 }}>{error}</p>
        <button
          className="btn btn-primary"
          style={{ marginTop: '16px' }}
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Top Header shown on Home views */}
      {(viewState === 'home') && (
        <Header
          activeTab={activeTab}
          onTabChange={(tab) => { sound.playTap(); setActiveTab(tab); }}
          completedCount={completedCount}
          streak={streak}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {/* Main Content Router */}
      <main className="app-content">
        {viewState === 'home' && activeTab === 'assignment' && (
          <>
            {homeSection ? (
              <DailyAssignmentCard
                section={homeSection}
                progress={progressMap[homeSection.id]}
                onStartLesson={handleStartLesson}
                onStartQuiz={handleStartQuiz}
                onOpenScenario={handleOpenScenario}
                onOpenHistory={() => setShowHistory(true)}
              />
            ) : (
              <div className="curriculum-completed-card animate-slide-up">
                <div className="owl-trophy-badge">🏆</div>
                <h2>Curriculum Completed!</h2>
                <p>You have mastered all published technical interview sections in the curriculum.</p>
                <button 
                  className="btn btn-secondary mt-3"
                  onClick={() => { sound.playTap(); setActiveTab('curriculum'); }}
                >
                  Explore Course Tracks
                </button>
              </div>
            )}
          </>
        )}

        {viewState === 'home' && activeTab === 'curriculum' && (
          <TracksOverview
            manifest={manifest}
            progressMap={progressMap}
            onSelectTopic={handleSelectTopic}
          />
        )}

        {viewState === 'topic-path' && selectedTopic && (
          <TopicLearningPath
            topic={selectedTopic}
            progressMap={progressMap}
            onSelectSection={handleSelectSectionFromPath}
            onBackToTracks={() => setViewState('home')}
          />
        )}

        {viewState === 'lesson' && (
          <LessonView
            lesson={currentLesson}
            onBack={() => { sound.playTap(); setViewState(selectedTopic ? 'topic-path' : 'home'); }}
            onStartQuiz={() => { sound.playTap(); setViewState('quiz'); }}
          />
        )}

        {viewState === 'quiz' && (
          <QuizExperience
            questions={currentLesson?.questions || []}
            onFinishQuiz={handleFinishQuiz}
            onExit={() => { sound.playTap(); setViewState(selectedTopic ? 'topic-path' : 'home'); }}
          />
        )}

        {viewState === 'summary' && (
          <CompletionSummary
            score={lastQuizResult?.score || 0}
            total={lastQuizResult?.total || (currentLesson?.questions?.length || 8)}
            records={lastQuizResult?.records || []}
            onRetakeQuiz={() => { sound.playTap(); setViewState('quiz'); }}
            onReviewLesson={() => { sound.playTap(); setViewState('lesson'); }}
            onDone={handleDoneSummary}
          />
        )}

        {viewState === 'scenario' && (
          <InterviewScenarioView
            scenarios={currentLesson?.interviewScenarios || []}
            onBack={() => { sound.playTap(); setViewState('lesson'); }}
          />
        )}
      </main>

      {/* Audit Trail History Modal */}
      {showHistory && (
        <HistoryModal
          sectionId={homeSection?.id || activeSection?.id || 'index-fundamentals'}
          sectionTitle={homeSection?.title || activeSection?.title || 'Section Quiz'}
          onClose={() => setShowHistory(false)}
          onRetakeQuiz={() => {
            setShowHistory(false);
            setViewState('quiz');
          }}
        />
      )}

      {/* Preferences & Settings Modal */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onResetProgress={handleResetProgress}
        />
      )}

      <style>{`
        .app-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .app-content {
          flex: 1;
        }

        .curriculum-completed-card {
          margin: 30px 16px;
          padding: 40px 20px;
          background: #ffffff;
          border: 2px solid #a7f3d0;
          border-radius: var(--radius-lg);
          text-align: center;
          box-shadow: 0 4px 0 #a7f3d0;
        }

        .owl-trophy-badge {
          font-size: 3.5rem;
          margin-bottom: 12px;
        }

        .curriculum-completed-card h2 {
          font-size: 1.5rem;
          font-weight: 900;
          color: #065f46;
          margin-bottom: 6px;
        }

        .curriculum-completed-card p {
          font-size: 0.92rem;
          color: #047857;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}

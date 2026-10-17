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

import { fetchManifest, fetchLesson, resolveActiveAssignment } from './services/api';
import { 
  getAllProgress, 
  saveSectionProgress, 
  recordQuizAttempt,
  clearAllProgress 
} from './services/storage';
import { sound } from './services/sound';

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

  // Initialize data on mount
  useEffect(() => {
    async function initApp() {
      try {
        setLoading(true);
        const [manifestData, storedProgress] = await Promise.all([
          fetchManifest(),
          getAllProgress(),
        ]);

        setManifest(manifestData);
        setProgressMap(storedProgress || {});

        const initialActive = resolveActiveAssignment(manifestData, storedProgress || {});
        setActiveSection(initialActive);

        // Preload lesson for active section
        if (initialActive?.lessonPath) {
          try {
            const lessonData = await fetchLesson(initialActive.lessonPath);
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
    if (currentLesson && currentLesson.sectionId === section.id) {
      return currentLesson;
    }
    try {
      setLoading(true);
      const lessonData = await fetchLesson(section.lessonPath);
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

  const handleSelectTopic = (topic) => {
    sound.playTap();
    setSelectedTopic(topic);
    setViewState('topic-path');
  };

  const handleSelectSectionFromPath = async (section) => {
    sound.playTap();
    setActiveSection(section);
    await loadSectionContent(section);
    setViewState('lesson');
  };

  const handleStartLesson = async () => {
    sound.playTap();
    if (activeSection) {
      await loadSectionContent(activeSection);
    }
    setViewState('lesson');
  };

  const handleStartQuiz = async () => {
    sound.playTap();
    if (activeSection) {
      await loadSectionContent(activeSection);
    }
    setViewState('quiz');
  };

  const handleOpenScenario = async () => {
    sound.playTap();
    if (activeSection) {
      await loadSectionContent(activeSection);
    }
    setViewState('scenario');
  };

  const handleFinishQuiz = async (results) => {
    const { score, total, records } = results;
    setLastQuizResult(results);

    const sectionId = activeSection?.id || currentLesson?.sectionId;
    if (sectionId) {
      const isPassed = score / total >= 0.75;
      const existingProg = progressMap[sectionId] || {};
      const bestScore = Math.max(existingProg.bestScore ?? 0, score);
      
      const updatedProg = {
        sectionId,
        completed: existingProg.completed || isPassed,
        lastScore: score,
        bestScore,
        totalQuestions: total,
        attemptsCount: (existingProg.attemptsCount || 0) + 1,
        lastAttemptDate: new Date().toISOString()
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

      const newMap = { ...progressMap, [sectionId]: updatedProg };
      setProgressMap(newMap);

      if (!existingProg.completed && isPassed) {
        const nextIncomplete = resolveActiveAssignment(manifest, newMap);
        setActiveSection(nextIncomplete);
        // Preload next section's lesson immediately so stale content is impossible
        if (nextIncomplete?.lessonPath) {
          loadSectionContent(nextIncomplete);
        } else {
          setCurrentLesson(null);
        }
      }
    }

    setViewState('summary');
  };

  const completedCount = Object.values(progressMap).filter((p) => p.completed).length;

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

  // Modal state
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleResetProgress = async () => {
    await clearAllProgress();
    setProgressMap({});
    const initialActive = resolveActiveAssignment(manifest, {});
    setActiveSection(initialActive);
    if (initialActive?.lessonPath) {
      loadSectionContent(initialActive);
    }
  };

  return (
    <div className="app-container">
      {/* Top Header shown on Home views */}
      {(viewState === 'home') && (
        <Header
          activeTab={activeTab}
          onTabChange={(tab) => { sound.playTap(); setActiveTab(tab); }}
          completedCount={completedCount}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {/* Main Content Router */}
      <main className="app-content">
        {viewState === 'home' && activeTab === 'assignment' && (
          <>
            {activeSection ? (
              <DailyAssignmentCard
                section={activeSection}
                progress={progressMap[activeSection.id]}
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
            onOpenScenario={() => { sound.playTap(); setViewState('scenario'); }}
          />
        )}

        {viewState === 'quiz' && (
          <QuizExperience
            sectionId={activeSection?.id || currentLesson?.sectionId}
            questions={currentLesson?.questions || []}
            onFinishQuiz={handleFinishQuiz}
            onExit={() => { sound.playTap(); setViewState(selectedTopic ? 'topic-path' : 'home'); }}
          />
        )}

        {viewState === 'summary' && (
          <CompletionSummary
            score={lastQuizResult?.score || 0}
            total={lastQuizResult?.total || (currentLesson?.questionCount || 8)}
            records={lastQuizResult?.records || []}
            onRetakeQuiz={() => { sound.playTap(); setViewState('quiz'); }}
            onReviewLesson={() => { sound.playTap(); setViewState('lesson'); }}
            onDone={() => { sound.playTap(); setViewState(selectedTopic ? 'topic-path' : 'home'); }}
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
          sectionId={activeSection?.id || 'index-fundamentals'}
          sectionTitle={activeSection?.title || 'Section Quiz'}
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

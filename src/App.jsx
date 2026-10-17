import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DailyAssignmentCard from './components/DailyAssignmentCard';
import TracksOverview from './components/TracksOverview';
import TopicLearningPath from './components/TopicLearningPath';
import LessonView from './components/LessonView';
import QuizExperience from './components/QuizExperience';
import CompletionSummary from './components/CompletionSummary';
import InterviewScenarioView from './components/InterviewScenarioView';

import { fetchManifest, fetchLesson, resolveActiveAssignment } from './services/api';
import { 
  getAllProgress, 
  saveSectionProgress, 
  recordQuizAttempt 
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
    if (!section?.lessonPath) return null;
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
    if (!currentLesson && activeSection) {
      await loadSectionContent(activeSection);
    }
    setViewState('lesson');
  };

  const handleStartQuiz = async () => {
    sound.playTap();
    if (!currentLesson && activeSection) {
      await loadSectionContent(activeSection);
    }
    setViewState('quiz');
  };

  const handleOpenScenario = async () => {
    sound.playTap();
    if (!currentLesson && activeSection) {
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
      
      const updatedProg = {
        sectionId,
        completed: existingProg.completed || isPassed,
        lastScore: score,
        totalQuestions: total,
        attemptsCount: (existingProg.attemptsCount || 0) + 1,
        lastAttemptDate: new Date().toISOString()
      };

      await saveSectionProgress(updatedProg);
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

  return (
    <div className="app-container">
      {/* Top Header shown on Home views */}
      {(viewState === 'home') && (
        <Header
          activeTab={activeTab}
          onTabChange={(tab) => { sound.playTap(); setActiveTab(tab); }}
          completedCount={completedCount}
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
              />
            ) : (
              <div className="empty-home p-4 text-center">
                <h3>Curriculum Completed!</h3>
                <p>You have mastered all published technical interview sections.</p>
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

      <style>{`
        .app-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .app-content {
          flex: 1;
        }

        .empty-home {
          padding: 40px 20px;
          text-align: center;
        }
      `}</style>
    </div>
  );
}

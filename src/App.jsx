import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import HomeScreen from './components/HomeScreen';
import TracksOverview from './components/TracksOverview';
import ProgressScreen from './components/ProgressScreen';
import TopicLearningPath from './components/TopicLearningPath';
import LessonView from './components/LessonView';
import QuizExperience from './components/QuizExperience';
import CompletionSummary from './components/CompletionSummary';
import InterviewScenarioView from './components/InterviewScenarioView';
import SettingsModal from './components/SettingsModal';

import {
  fetchManifest,
  fetchLesson,
  getTodayKolkataString,
  computeStreak,
  computeRecentAccuracy,
  getWeakSections,
  getRecentActivityDays,
  findSectionInManifest,
  findTopicInManifest,
} from './services/api';
import {
  getAllProgress,
  saveSectionProgress,
  recordQuizAttempt,
  getAllQuizAttempts,
  getPreferences,
  clearAllProgress,
} from './services/storage';
import { sound } from './services/sound';

// Remembers which lesson the learner is currently on (highest continue priority)
const LAST_SECTION_KEY = 'interview_prep_last_section';
// Remembers the full navigation position (view + contexts) across refreshes
const NAV_KEY = 'interview_prep_nav';
// Last completed quiz result, so the summary screen survives a refresh
const RESULT_KEY = 'interview_prep_last_result';
// Prefixes for every local-only key produced by a section visit
const CLEARABLE_KEY_PREFIXES = [
  'interview_prep_quiz_',
  'interview_prep_lesson_',
];

const RESTORABLE_VIEWS = ['topic-path', 'lesson', 'scenario', 'quiz', 'summary', 'curriculum', 'progress'];
// Views where the bottom navigation bar is visible (deep flows hide it)
const NAV_VISIBLE_VIEWS = ['home', 'curriculum', 'progress'];

function readNavState() {
  try {
    const nav = JSON.parse(localStorage.getItem(NAV_KEY) || 'null');
    return nav && typeof nav === 'object' ? nav : null;
  } catch {
    return null;
  }
}

function saveNavState(nav) {
  try {
    localStorage.setItem(NAV_KEY, JSON.stringify(nav));
  } catch {
    // localStorage unavailable; the app still works within the session
  }
}

function clearNavState() {
  try {
    localStorage.removeItem(NAV_KEY);
  } catch {
    // localStorage unavailable
  }
}

function clearSectionLocalKeys() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const key = localStorage.key(i);
      if (key && CLEARABLE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // localStorage unavailable; nothing persisted to clear
  }
}

/** Flattened list of published sections with topic context attached. */
function getPublishedSections(manifestData) {
  if (!manifestData?.topics) return [];
  const rows = [];
  for (const topic of manifestData.topics) {
    for (const section of topic.sections || []) {
      if (section.status === 'published') rows.push({ ...section, topicId: topic.id, topicTitle: topic.title });
    }
  }
  return rows;
}

/**
 * Deterministic "continue" resolution (priority order):
 * 1. last-viewed section if still incomplete
 * 2. next eligible (first incomplete published section in curriculum order)
 * 3. null when everything published is complete (Home shows the mastered card)
 */
function resolveContinueSection(manifestData, progressMap) {
  const published = getPublishedSections(manifestData);
  try {
    const lastSectionId = localStorage.getItem(LAST_SECTION_KEY);
    if (lastSectionId) {
      const lastSection = published.find((section) => section.id === lastSectionId);
      if (lastSection && !progressMap[lastSection.id]?.completed) return lastSection;
    }
  } catch {
    // localStorage unavailable; fall through to the curriculum-order pick
  }
  return published.find((section) => !progressMap[section.id]?.completed) || null;
}

export default function App() {
  const [manifest, setManifest] = useState(null);
  const [progressMap, setProgressMap] = useState({});
  const [activeSection, setActiveSection] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);

  // Selected topic for dedicated topic learning path page
  const [selectedTopic, setSelectedTopic] = useState(null);

  // Navigation states: 'home' | 'curriculum' | 'progress' | 'topic-path' | 'lesson' | 'quiz' | 'summary' | 'scenario'
  const [viewState, setViewState] = useState('home');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastQuizResult, setLastQuizResult] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [streak, setStreak] = useState(0);

  // Modals state (declared at top before any conditional return)
  const [showSettings, setShowSettings] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    async function initApp() {
      try {
        setLoading(true);
        // Read the saved navigation position synchronously so the restore
        // lesson fetch can start in parallel with the manifest fetch —
        // the very first paint after loading is already the saved view
        const nav = readNavState();
        const navlessonRef = nav?.lessonId || null;
        const canRestoreLessonView = nav && ['lesson', 'scenario', 'quiz'].includes(nav.view);
        const [manifestData, storedProgress, storedAttempts, restoredLesson] = await Promise.all([
          fetchManifest(),
          getAllProgress(),
          getAllQuizAttempts(),
          canRestoreLessonView
            ? (navlessonRef ? fetchLesson(navlessonRef).catch(() => null) : Promise.resolve(null))
            : Promise.resolve(null),
        ]);

        // Honor persisted sound preference before any interaction needs audio
        sound.setEnabled(getPreferences().sound !== false);

        setManifest(manifestData);
        setProgressMap(storedProgress || {});
        setQuizAttempts(storedAttempts || []);
        setStreak(computeStreak(storedAttempts || [], storedProgress || {}));

        // Resume the saved navigation position (lesson/quiz/scenario/etc.)
        // so a refresh reopens exactly where the learner was, not the home page
        let startedSection = resolveContinueSection(manifestData, storedProgress || {});
        let restorable = false;

        if (nav && RESTORABLE_VIEWS.includes(nav.view)) {
          if (nav.view === 'curriculum' || nav.view === 'progress') {
            // Tab-level views restore without any section context
            restorable = true;
          } else if (nav.view === 'topic-path') {
            const topic = findTopicInManifest(manifestData, nav.topicId);
            if (topic) {
              setSelectedTopic(topic);
              restorable = true;
            }
          } else {
            const section = findSectionInManifest(manifestData, nav.sectionId);
            if (section && section.status === 'published') {
              if (nav.view === 'summary') {
                try {
                  const storedResult = JSON.parse(localStorage.getItem(RESULT_KEY) || 'null');
                  if (storedResult && typeof storedResult.score === 'number') {
                    setLastQuizResult(storedResult);
                    restorable = true;
                  }
                } catch {
                  // no saved result; drop back to home
                }
              } else if (navlessonRef && restoredLesson && restoredLesson.id === navlessonRef) {
                setCurrentLesson(restoredLesson);
                restorable = true;
              } else {
                try {
                  const lessonData = await fetchLesson(section.lessonId || section.id);
                  setCurrentLesson(lessonData);
                  restorable = true;
                } catch (err) {
                  console.error('Failed to restore lesson content', err);
                }
              }
              if (restorable) startedSection = section;
            }
          }
        }
        setActiveSection(startedSection);

        if (restorable) setViewState(nav.view);

        // Seed the browser history entry for the initial view so the very
        // first back press pops an in-app snapshot instead of exiting
        const initialSnapshot = restorable && nav
          ? { view: nav.view, topicId: nav.topicId, sectionId: nav.sectionId, lessonId: nav.lessonId }
          : { view: 'home', sectionId: startedSection?.id, lessonId: startedSection?.lessonId };
        try {
          window.history.replaceState(initialSnapshot, '');
        } catch {
          // history unavailable; back button then simply exits as before
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
    if (!section?.lessonPath && !section?.lessonId && !section?.id) {
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

  // Build a restorable snapshot of a navigation target (also used by popstate)
  const buildSnapshot = (view, extra = {}) => ({
    view,
    topicId: extra.topicId ?? (view === 'topic-path' ? selectedTopic?.id : undefined),
    sectionId: extra.sectionId ?? activeSection?.id,
    lessonId: extra.lessonId ?? activeSection?.lessonId,
  });

  // Central navigation helper: persists the view AND pushes a browser history
  // entry so the hardware/browser back button navigates in-app instead of
  // minimizing/leaving the app
  const go = (view, extra = {}) => {
    const snapshot = buildSnapshot(view, extra);
    saveNavState(snapshot);
    try {
      window.history.pushState(snapshot, '');
    } catch {
      // history unavailable in some embeds; in-session navigation still works
    }
    setViewState(view);
  };

  // Explicit back affordances pop the history stack (popstate restores the
  // previous in-app view). Falls back to home when there is nothing to pop.
  const goBack = () => {
    sound.playTap();
    if (window.history.length > 1) {
      window.history.back();
    } else {
      go('home');
    }
  };

  // popstate restore: the hardware/browser back button lands on the previous
  // in-app history entry. Kept in a ref so it always reads fresh state without
  // re-subscribing the listener.
  const popRestoreRef = useRef(() => {});
  popRestoreRef.current = async (event) => {
    const snapshot = event?.state;
    if (!snapshot?.view) {
      // Entry before any of ours (e.g. browser start page): treat as home
      setViewState('home');
      return;
    }
    saveNavState(snapshot);
    const { view, topicId, sectionId, lessonId } = snapshot;

    if (manifest && view === 'topic-path') {
      const topic = findTopicInManifest(manifest, topicId);
      if (topic) setSelectedTopic(topic);
      setViewState('topic-path');
      return;
    }

    if (manifest && ['lesson', 'quiz', 'scenario', 'summary'].includes(view) && sectionId) {
      const section = findSectionInManifest(manifest, sectionId);
      if (section) {
        setActiveSection(section);
        const wantLessonId = section.lessonId || section.id || lessonId;
        if (!currentLesson || (currentLesson.id !== lessonId && currentLesson.id !== wantLessonId)) {
          try {
            setCurrentLesson(await fetchLesson(wantLessonId));
          } catch (err) {
            console.error('Failed to restore lesson content on back navigation', err);
          }
        }
        if (view === 'summary') {
          try {
            const storedResult = JSON.parse(localStorage.getItem(RESULT_KEY) || 'null');
            if (storedResult && typeof storedResult.score === 'number') {
              setLastQuizResult(storedResult);
            } else {
              setViewState('home');
              return;
            }
          } catch {
            setViewState('home');
            return;
          }
        }
        setViewState(view);
        return;
      }
    }

    setViewState(view);
  };

  useEffect(() => {
    const handlePop = (event) => { popRestoreRef.current(event); };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

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
    const targetTopicId = section.topicId ?? selectedTopic?.id;
    if (view === 'lesson' && targetTopicId) setSelectedTopic((prev) => {
      const topic = manifest?.topics?.find((t) => t.id === targetTopicId);
      return topic || prev;
    });
    const snapshot = { view, topicId: targetTopicId, sectionId: section.id, lessonId: section.lessonId };
    saveNavState(snapshot);
    try {
      window.history.pushState(snapshot, '');
    } catch {
      // history unavailable; in-session navigation still works
    }
    await loadSectionContent(section);
    setViewState(view);
  };

  const handleSelectTopic = (topic) => {
    sound.playTap();
    setSelectedTopic(topic);
    const snapshot = { view: 'topic-path', topicId: topic.id };
    saveNavState(snapshot);
    try {
      window.history.pushState(snapshot, '');
    } catch {
      // history unavailable; in-session navigation still works
    }
    setViewState('topic-path');
  };

  const handleSelectSectionFromPath = (section) => openSection(section, 'lesson');

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
        ...(isFirstPass ? { completedDate: getTodayKolkataString() } : {}),
      };

      const saved = await saveSectionProgress(updatedProg);
      if (!saved) {
        console.warn('Could not persist progress to IndexedDB');
      }
      await recordQuizAttempt({
        sectionId,
        score,
        total,
        records,
      });

      // Include the just-recorded attempt (and today's progress entry) so
      // the streak and dashboard reflect today's activity
      const updatedAttempts = [
        ...quizAttempts,
        { sectionId, timestamp: new Date().toISOString() },
      ];
      const newMap = { ...progressMap, [sectionId]: updatedProg };
      setQuizAttempts(updatedAttempts);
      setProgressMap(newMap);
      setStreak(computeStreak(updatedAttempts, newMap));

      // Do NOT preemptively overwrite currentLesson or activeSection here!
      // This preserves the completed lesson and results throughout the CompletionSummary screen
      // so "Review Lesson" opens the lesson the user just completed.
    }

    try {
      localStorage.setItem(RESULT_KEY, JSON.stringify(results));
    } catch {
      // localStorage unavailable; the result still shows within this session
    }
    go('summary');
  };

  const handleResetProgress = async () => {
    await clearAllProgress();
    clearSectionLocalKeys();
    try {
      localStorage.removeItem(LAST_SECTION_KEY);
      localStorage.removeItem(RESULT_KEY);
    } catch {
      // localStorage unavailable; nothing persisted to clear
    }
    clearNavState();
    const emptied = {};
    setProgressMap(emptied);
    setActiveSection(resolveContinueSection(manifest, emptied));
    setSelectedTopic(null);
    go('home');
    setLastQuizResult(null);
    // History is stored alongside progress attempts
    setQuizAttempts([]);
    setStreak(0);
  };

  const handleDoneSummary = async () => {
    sound.playTap();
    // Resolve next active section only upon leaving the summary screen
    const nextAssignment = resolveContinueSection(manifest, progressMap);
    if (nextAssignment && nextAssignment.id !== activeSection?.id) {
      setActiveSection(nextAssignment);
      try {
        localStorage.setItem(LAST_SECTION_KEY, nextAssignment.id);
      } catch {
        // localStorage unavailable; in-session state still works
      }
      if (nextAssignment.lessonId || nextAssignment.id) {
        loadSectionContent(nextAssignment);
      }
    }
    try {
      localStorage.removeItem(RESULT_KEY);
    } catch {
      // localStorage unavailable
    }
    go('home');
  };

  const completedCount = Object.values(progressMap).filter((p) => p.completed).length;

  // Live dashboard stats (attempts + progress activity, no invented data)
  // Continue priority: the learner's active section while it is still
  // incomplete, else the deterministic resolver (last-viewed → next eligible)
  const continueSection = manifest
    ? ((activeSection && activeSection.status === 'published' && !progressMap[activeSection.id]?.completed)
      ? activeSection
      : resolveContinueSection(manifest, progressMap))
    : null;
  const recentAccuracy = computeRecentAccuracy(quizAttempts);
  const weakTopics = getWeakSections(progressMap).map((weak) => ({
    ...weak,
    title: findSectionInManifest(manifest, weak.sectionId)?.title || weak.sectionId,
  }));
  const activityDays = getRecentActivityDays(quizAttempts, progressMap, 7);

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

  const isTopLevel = NAV_VISIBLE_VIEWS.includes(viewState);

  return (
    <div className="app-container">
      {/* Top Header shown on Home views */}
      {isTopLevel && (
        <Header
          completedCount={completedCount}
          streak={streak}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {/* Main Content Router */}
      <main className="app-content">
        {viewState === 'home' && (
          <HomeScreen
            manifest={manifest}
            progressMap={progressMap}
            streak={streak}
            activityDays={activityDays}
            attempts={quizAttempts}
            currentLesson={currentLesson}
            continueSection={continueSection}
            weakTopics={weakTopics}
            recentAccuracy={recentAccuracy}
            onOpenSection={(section) => openSection(section, 'lesson')}
            onOpenProgress={() => go('progress')}
            onOpenTracks={() => go('curriculum')}
            onOpenTopic={handleSelectTopic}
          />
        )}

        {viewState === 'curriculum' && (
          <TracksOverview
            manifest={manifest}
            progressMap={progressMap}
            onSelectTopic={handleSelectTopic}
            onSelectSection={openSection}
            activeSectionId={activeSection?.id}
          />
        )}

        {viewState === 'progress' && (
          <ProgressScreen
            manifest={manifest}
            progressMap={progressMap}
            attempts={quizAttempts}
            onOpenSection={(section) => openSection(section, 'lesson')}
          />
        )}

        {viewState === 'topic-path' && selectedTopic && (
          <TopicLearningPath
            topic={selectedTopic}
            progressMap={progressMap}
            onSelectSection={handleSelectSectionFromPath}
            onBackToTracks={() => goBack()}
          />
        )}

        {viewState === 'lesson' && (
          <LessonView
            lesson={currentLesson}
            sectionId={activeSection?.id || currentLesson?.sectionId}
            onBack={() => goBack()}
            onStartQuiz={() => { sound.playTap(); go('quiz'); }}
          />
        )}

        {viewState === 'quiz' && (
          <QuizExperience
            sectionId={activeSection?.id || currentLesson?.sectionId}
            questions={currentLesson?.questions || []}
            onFinishQuiz={handleFinishQuiz}
            onExit={() => goBack()}
          />
        )}

        {viewState === 'summary' && (
          <CompletionSummary
            score={lastQuizResult?.score || 0}
            total={lastQuizResult?.total || (currentLesson?.questions?.length || 8)}
            records={lastQuizResult?.records || []}
            onRetakeQuiz={() => { sound.playTap(); go('quiz'); }}
            onReviewLesson={() => { sound.playTap(); go('lesson'); }}
            onDone={handleDoneSummary}
          />
        )}

        {viewState === 'scenario' && (
          <InterviewScenarioView
            scenarios={currentLesson?.interviewScenarios || []}
            onBack={() => goBack()}
          />
        )}
      </main>

      {/* Primary bottom navigation (hidden during deep flows) */}
      {isTopLevel && (
        <BottomNav
          currentView={viewState}
          onViewChange={(view) => {
            setActiveSection((prev) => prev ?? resolveContinueSection(manifest, progressMap));
            go(view);
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
      `}</style>
    </div>
  );
}

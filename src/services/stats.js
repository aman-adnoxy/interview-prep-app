/**
 * Pure, dependency-free learning statistics helpers used by the dashboard
 * (streak, calendar ring, recent accuracy, weak topics). No Ajv/network.
 */

export function getTodayKolkataString(date = new Date()) {
  try { return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); }
  catch { return date.toISOString().split('T')[0]; }
}

/**
 * Learning activity = quiz attempt timestamps + persisted progress activity
 * (lastAttemptDate ISO strings and completedDate Kolkata date strings).
 */
export function collectActivityDates(attempts, progressMap) {
  const days = new Set();
  for (const attempt of attempts || []) {
    if (attempt?.timestamp) days.add(getTodayKolkataString(new Date(attempt.timestamp)));
  }
  for (const entry of Object.values(progressMap || {})) {
    if (entry?.lastAttemptDate) days.add(getTodayKolkataString(new Date(entry.lastAttemptDate)));
    if (entry?.completedDate && /^\d{4}-\d{2}-\d{2}$/.test(entry.completedDate)) {
      days.add(entry.completedDate);
    }
  }
  return days;
}

/** Activity intersected with the last `n` calendar days (today backwards). */
export function getRecentActivityDays(attempts, progressMap, n = 7) {
  const activity = collectActivityDates(attempts, progressMap);
  const recent = [];
  const cursor = new Date();
  for (let i = 0; i < n; i += 1) {
    recent.push(getTodayKolkataString(cursor));
    cursor.setDate(cursor.getDate() - 1);
  }
  return recent.map((day) => activity.has(day));
}

export function computeStreak(attempts, progressMap) {
  const activeDays = collectActivityDates(attempts, progressMap);
  if (activeDays.size === 0) return 0;
  const cursor = new Date();
  if (!activeDays.has(getTodayKolkataString(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (activeDays.has(getTodayKolkataString(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/**
 * Average accuracy across the `lastN` most recent valid scored attempts,
 * ordered by timestamp descending. Returns null when no valid attempts exist.
 */
export function computeRecentAccuracy(attempts, lastN = 3) {
  const valid = (attempts || [])
    .filter((attempt) => attempt
      && Number.isFinite(attempt.score) && attempt.score >= 0
      && Number.isFinite(attempt.total) && attempt.total > 0
      && attempt.timestamp)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, lastN);
  if (valid.length === 0) return null;
  const accuracy = valid.reduce((sum, attempt) => sum + (attempt.score / attempt.total) * 100, 0) / valid.length;
  return Math.round(accuracy);
}

/**
 * Sections with real progress data that were last scored below the 75% pass
 * threshold and are not yet completed ("topics to revisit").
 */
export function getWeakSections(progressMap) {
  return Object.values(progressMap || {})
    .filter((entry) => entry?.sectionId
      && !entry.completed
      && Number.isFinite(entry.totalQuestions) && entry.totalQuestions > 0
      && Number.isFinite(entry.lastScore)
      && entry.lastScore / entry.totalQuestions < 0.75)
    .map((entry) => ({
      sectionId: entry.sectionId,
      pct: Math.round((entry.lastScore / entry.totalQuestions) * 100),
    }));
}

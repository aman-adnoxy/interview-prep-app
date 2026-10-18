import test from 'node:test';
import assert from 'node:assert/strict';
import {
  collectActivityDates,
  computeStreak,
  computeRecentAccuracy,
  getWeakSections,
  getRecentActivityDays,
} from '../src/services/stats.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const kolkataToday = () => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  return parts; // en-CA yields YYYY-MM-DD
};

test('activity dates come from both attempts and persisted progress', () => {
  const attempts = [{ timestamp: new Date().toISOString() }];
  const progressMap = {
    a: { sectionId: 'a', completed: true, completedDate: kolkataToday() },
    b: { sectionId: 'b', lastAttemptDate: new Date(Date.now() - DAY_MS).toISOString() },
  };
  const days = collectActivityDates(attempts, progressMap);
  assert.ok(days.has(kolkataToday()));
  const yesterdayCursor = new Date(Date.now() - DAY_MS);
  assert.ok(days.has(kolkataToday(yesterdayCursor)) || days.has(new Date(Date.now() - DAY_MS).toISOString().split('T')[0]));
});

test('streak counts consecutive active days ending today or yesterday', () => {
  const today = kolkataToday();
  const progressMap = {
    a: { sectionId: 'a', completed: true, completedDate: today },
    b: { sectionId: 'b', lastAttemptDate: new Date(Date.now() - DAY_MS).toISOString() },
  };
  assert.equal(computeStreak([], progressMap), 2);
  assert.equal(computeStreak([], {}), 0);
});

test('recent accuracy uses only the three most recent valid attempts', () => {
  const now = Date.now();
  const attempts = [
    { score: 8, total: 10, timestamp: new Date(now - 5 * DAY_MS).toISOString() },
    { score: 1, total: 0, timestamp: new Date(now - 4 * DAY_MS).toISOString() }, // invalid total
    { score: 9, total: 10, timestamp: new Date(now - 3 * DAY_MS).toISOString() },
    { score: 6, total: 10, timestamp: new Date(now - 1 * DAY_MS).toISOString() },
    { score: 4, total: 10, timestamp: new Date(now - 2 * DAY_MS).toISOString() },
  ];
  // Most recent (6/10 = 60%), then 4/10 = 40%, then 9/10 = 90% -> avg 63.33 -> 63
  assert.equal(computeRecentAccuracy(attempts), 63);
  assert.equal(computeRecentAccuracy([]), null);
  assert.equal(computeRecentAccuracy([{ score: 1, total: 0 }]), null);
});

test('weak sections exclude completed sections and clamp to pass threshold', () => {
  const progressMap = {
    done: { sectionId: 'done', completed: true, lastScore: 2, totalQuestions: 10 },
    weak: { sectionId: 'weak', completed: false, lastScore: 4, totalQuestions: 8 }, // 50%
    passing: { sectionId: 'passing', completed: false, lastScore: 9, totalQuestions: 10 }, // 90%
    touching: { sectionId: 'touching', completed: false, lastScore: 6, totalQuestions: 8 }, // 75% = pass boundary
    nodata: { sectionId: 'nodata' },
  };
  const weak = getWeakSections(progressMap);
  assert.deepEqual(weak, [{ sectionId: 'weak', pct: 50 }]);
});

test('recent activity ring resolves the last n calendar days', () => {
  const today = kolkataToday();
  const progressMap = { a: { sectionId: 'a', completed: true, completedDate: today } };
  const ring = getRecentActivityDays([], progressMap, 7);
  assert.equal(ring.length, 7);
  assert.equal(ring[0], true); // today active
  assert.equal(ring.filter(Boolean).length, 1);
});

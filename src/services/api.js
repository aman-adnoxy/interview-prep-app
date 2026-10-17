import Ajv2020 from 'ajv/dist/2020.js';
import lessonSchema from '../../schema/lesson.schema.json';
import { validateLessonPayload } from './contentValidation.js';
const ajv = new Ajv2020({ allErrors: true, strict: true });
const validateShape = ajv.compile(lessonSchema);
export async function fetchManifest() {
  const response = await fetch('./manifest.json');
  if (!response.ok) throw new Error('Curriculum manifest unavailable (HTTP ' + response.status + ').');
  return response.json();
}
let contentIndexPromise;
async function getContentIndex() {
  if (!contentIndexPromise) contentIndexPromise = fetch('./content-index.json').then(response => {
    if (!response.ok) throw new Error('Published content index unavailable (HTTP ' + response.status + ').');
    return response.json();
  }).catch(error => { contentIndexPromise = null; throw error; });
  return contentIndexPromise;
}
export async function fetchLesson(lessonRef) {
  const index = await getContentIndex();
  const entry = index.lessons?.[lessonRef];
  if (!entry) throw new Error('Lesson "' + lessonRef + '" is not present in the published content index.');
  const response = await fetch('.' + entry.path);
  if (!response.ok) throw new Error('Lesson asset unavailable (HTTP ' + response.status + '): ' + entry.path);
  const lesson = await response.json();
  validateLessonPayload(lesson, validateShape);
  if (lesson.id !== lessonRef) throw new Error('Lesson ID mismatch: expected ' + lessonRef + ', received ' + lesson.id + '.');
  return lesson;
}
export function resolveActiveAssignment(manifest, progressMap) {
  if (!manifest?.topics) return null;
  const allSections = [];
  for (const topic of manifest.topics) for (const section of topic.sections || []) {
    if (section.status === 'published') allSections.push({ ...section, topicId: topic.id, topicTitle: topic.title });
  }
  return allSections.find(section => !progressMap[section.id]?.completed) || null;
}
export function getTodayKolkataString(date = new Date()) {
  try { return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); }
  catch { return date.toISOString().split('T')[0]; }
}

export function computeStreak(attempts) {
  const activeDays = new Set((attempts || []).map((attempt) => getTodayKolkataString(new Date(attempt.timestamp))));
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

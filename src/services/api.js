import Ajv2020 from 'ajv/dist/2020.js';
import lessonSchema from '../../schema/lesson.schema.json';
import { validateLessonPayload } from './contentValidation.js';

export {
  getTodayKolkataString,
  collectActivityDates,
  getRecentActivityDays,
  computeStreak,
  computeRecentAccuracy,
  getWeakSections,
} from './stats.js';

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

export function findSectionInManifest(manifestData, sectionId) {
  if (!manifestData?.topics || !sectionId) return null;
  for (const topic of manifestData.topics) {
    const match = (topic.sections || []).find((section) => section.id === sectionId);
    if (match) return { ...match, topicId: topic.id, topicTitle: topic.title };
  }
  return null;
}

export function findTopicInManifest(manifestData, topicId) {
  if (!manifestData?.topics || !topicId) return null;
  return manifestData.topics.find((topic) => topic.id === topicId) || null;
}

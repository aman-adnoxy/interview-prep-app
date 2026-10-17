import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = relativePath => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));

test('every published curriculum section resolves to a canonical lesson asset', () => {
  const manifest = readJson('public/manifest.json');
  const index = readJson('public/content-index.json');
  const published = manifest.topics.flatMap(topic => topic.sections.filter(section => section.status === 'published'));
  assert.ok(published.length > 0, 'expected published curriculum sections');
  for (const section of published) {
    assert.ok(section.lessonId, 'missing canonical lessonId for section ' + section.id);
    const entry = index.lessons[section.lessonId];
    assert.ok(entry, 'content index missing lessonId ' + section.lessonId + ' for section ' + section.id);
    const lesson = readJson('public' + entry.path);
    assert.equal(lesson.id, section.lessonId, 'lesson ID mismatch for section ' + section.id);
    assert.equal(entry.questionCount, lesson.questions.length, 'question count mismatch for section ' + section.id);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  groupSectionsByStage,
  countPublishedSections,
  countCompletedSections,
} from '../src/services/stages.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const loadManifest = () => JSON.parse(fs.readFileSync(path.join(root, 'public/manifest.json'), 'utf8'));

test('groups sections by stageId following stage order', () => {
  const topic = {
    id: 'databases',
    stages: [
      { id: 'b-stage', title: 'Stage B', description: 'Second', order: 2 },
      { id: 'a-stage', title: 'Stage A', description: 'First', order: 1 },
    ],
    sections: [
      { id: 's3', stageId: 'b-stage', status: 'published' },
      { id: 's1', stageId: 'a-stage', status: 'published' },
      { id: 's2', stageId: 'a-stage', status: 'published' },
    ],
  };
  const groups = groupSectionsByStage(topic);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].stage.id, 'a-stage'); // ordered by stage.order, not definition order
  assert.deepEqual(groups[0].sections.map((s) => s.id), ['s1', 's2']); // manifest order preserved
  assert.equal(groups[1].stage.id, 'b-stage');
});

test('legacy manifest without stages falls back to one flat group', () => {
  const topic = {
    id: 'databases',
    sections: [
      { id: 's1', status: 'published' },
      { id: 's2', status: 'published' },
    ],
  };
  const groups = groupSectionsByStage(topic);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].stage, null);
  assert.deepEqual(groups[0].sections.map((s) => s.id), ['s1', 's2']);
});

test('sections with unresolved stageId fall to a trailing group without crashing', () => {
  const topic = {
    id: 'x',
    stages: [{ id: 'known', title: 'Known', order: 1 }],
    sections: [
      { id: 's1', stageId: 'known', status: 'published' },
      { id: 's2', stageId: 'missing-stage', status: 'published' },
      { id: 's3', status: 'published' },
    ],
  };
  const groups = groupSectionsByStage(topic);
  assert.equal(groups.length, 2);
  assert.deepEqual(groups[0].sections.map((s) => s.id), ['s1']);
  assert.deepEqual(groups[1].sections.map((s) => s.id), ['s2', 's3']);
  assert.equal(groups[1].stage, null);
});

test('stage/track progress counts published sections only', () => {
  const group = { sections: [
    { id: 'a', status: 'published' },
    { id: 'b', status: 'published' },
    { id: 'c', status: 'upcoming' },
    { id: 'd', status: 'published' },
  ] };
  const progressMap = { a: { completed: true }, c: { completed: true } };
  assert.equal(countPublishedSections(group), 3);
  assert.equal(countCompletedSections(group, progressMap), 1); // 'c' excluded (unpublished)
});

test('published counts are safe against missing groups/sections', () => {
  assert.equal(countPublishedSections(null), 0);
  assert.equal(countCompletedSections(undefined, {}), 0);
  assert.doesNotThrow(() => groupSectionsByStage(null));
  assert.doesNotThrow(() => groupSectionsByStage({ id: 'x' }));
  const empty = groupSectionsByStage({ id: 'x', sections: [] });
  assert.deepEqual(empty[0].sections, []);
});

test('live manifest: stageIds resolve, unified tracks have expected sizes', () => {
  const manifest = loadManifest();
  const topics = manifest.topics || [];
  for (const topic of topics) {
    const stageIds = new Set((topic.stages || []).map((s) => s.id));
    for (const section of topic.sections || []) {
      if (section.stageId) {
        assert.ok(stageIds.has(section.stageId),
          `${topic.id}: section ${section.id} references unknown stage ${section.stageId}`);
      }
    }
  }

  const databases = topics.find((t) => t.id === 'databases');
  const publishedDatabases = (databases?.sections || []).filter((s) => s.status === 'published');
  assert.equal(publishedDatabases.length, 20, 'databases must expose 20 published sections');
  assert.equal(databases.stages.length, 7, 'databases must define 7 stages');
  assert.ok(databases.stages.every((s) => publishedDatabases.some((sec) => sec.stageId === s.id)),
    'every database stage must contain at least one published lesson');

  const ai = topics.find((t) => t.id === 'ai-engineering');
  const publishedAi = (ai?.sections || []).filter((s) => s.status === 'published');
  assert.equal(publishedAi.length, 20, 'ai-engineering must expose 20 sections');
  assert.equal(ai.stages.length, 2, 'ai-engineering must define 2 stages');
});

test('live manifest: section order matches stage order within each track stage', () => {
  const manifest = loadManifest();
  for (const topic of manifest.topics || []) {
    if (!topic.stages?.length) continue;
    for (const section of topic.sections || []) {
      if (!section.stageId) continue;
      const stageOrder = new Map(topic.stages.map((s, i) => [s.id, i]));
      const sectionIndex = topic.sections.indexOf(section);
      // Every preceding section belongs to the same or an earlier stage
      const stageIndexOf = stageOrder.get(section.stageId);
      for (let i = 0; i < sectionIndex; i++) {
        const prior = topic.sections[i];
        if (!prior.stageId) continue;
        assert.ok(stageOrder.get(prior.stageId) <= stageIndexOf,
          `${topic.id}: ${section.id} (stage ${prior.stageId}) appears before an earlier stage's section ${prior.id}`);
      }
    }
  }
});

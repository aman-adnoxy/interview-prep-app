/**
 * Stage grouping for the learning path. The manifest owns stage membership,
 * order and titles — this helper only orders and groups; it never invents
 * stage data. Legacy manifests without `stages`/`stageId` fall back to one
 * flat group so the existing rendering path is preserved.
 */
export function groupSectionsByStage(topic) {
  const sections = topic?.sections || [];
  const stages = Array.isArray(topic?.stages)
    ? topic.stages.filter((stage) => stage && typeof stage.id === 'string')
    : [];

  // Legacy manifest: no stage metadata → single flat group
  if (stages.length === 0) {
    return [{ stage: null, title: null, description: null, sections }];
  }

  const sortedStages = stages
    .slice()
    .sort((a, b) => (Number.isFinite(a.order) ? a.order : Number.MAX_SAFE_INTEGER)
      - (Number.isFinite(b.order) ? b.order : Number.MAX_SAFE_INTEGER));

  const groupByStageId = new Map();
  for (const stage of sortedStages) {
    groupByStageId.set(stage.id, { stage, title: stage.title || null, description: stage.description || null, sections: [] });
  }

  // Group sections by stageId while preserving manifest section order; any
  // section whose stageId does not resolve falls to a trailing flat group
  const orphans = [];
  for (const section of sections) {
    const group = section?.stageId ? groupByStageId.get(section.stageId) : null;
    if (group) {
      group.sections.push(section);
    } else {
      orphans.push(section);
    }
  }

  const groups = sortedStages.map((stage) => groupByStageId.get(stage.id));
  if (orphans.length > 0) {
    groups.push({ stage: null, title: null, description: null, sections: orphans });
  }
  return groups;
}

/** Published-section count of a group (upcoming sections excluded). */
export function countPublishedSections(group) {
  return (group?.sections || []).filter((section) => section?.status === 'published').length;
}

/** Completed-section count of a group against saved progress. */
export function countCompletedSections(group, progressMap = {}) {
  return (group?.sections || []).filter(
    (section) => section?.status === 'published' && Boolean(progressMap[section.id]?.completed)
  ).length;
}

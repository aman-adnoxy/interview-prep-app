/**
 * Service to fetch Manifest and Lessons.
 * Falls back to embedded import if running in an environment without server routing.
 */

export async function fetchManifest() {
  try {
    const res = await fetch('/manifest.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Network fetch for manifest.json failed, loading via direct fetch fallback:', err);
    // Try relative path
    const res = await fetch('./manifest.json');
    if (!res.ok) throw new Error(`Fallback HTTP ${res.status}`);
    return await res.json();
  }
}

export async function fetchLesson(lessonPath) {
  const cleanPath = lessonPath.startsWith('/') ? lessonPath : `/${lessonPath}`;
  try {
    const res = await fetch(cleanPath);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`Fetch for ${cleanPath} failed, trying relative:`, err);
    const res = await fetch(`.${cleanPath}`);
    if (!res.ok) throw new Error(`Fallback HTTP ${res.status}`);
    return await res.json();
  }
}

/**
 * Calculates the active assignment following the rules:
 * - One complete section per daily assignment
 * - Fixed sequence
 * - Missed days don't skip: picks the first incomplete section in the fixed sequence
 * - Resolves based on Asia/Kolkata date
 */
export function resolveActiveAssignment(manifest, progressMap) {
  if (!manifest || !manifest.topics) return null;

  // Flatten all sections in order
  const allSections = [];
  for (const topic of manifest.topics) {
    if (topic.sections && topic.sections.length > 0) {
      for (const section of topic.sections) {
        allSections.push({
          ...section,
          topicId: topic.id,
          topicTitle: topic.title,
        });
      }
    }
  }

  if (allSections.length === 0) return null;

  // Find first section that is NOT marked as completed
  const currentIncomplete = allSections.find((s) => {
    const prog = progressMap[s.id];
    return !prog || !prog.completed;
  });

  return currentIncomplete || allSections[0];
}

export function getTodayKolkataString() {
  try {
    const d = new Date();
    return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

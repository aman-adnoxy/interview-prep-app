import { 
  Database, 
  Server, 
  Layers, 
  Binary, 
  Cpu, 
  Bot
} from 'lucide-react';

// Single source of truth for curriculum track theming (used by Home, Curriculum, Path)
export const TOPIC_THEMES = {
  databases: {
    id: 'databases',
    icon: Database,
    color: '#58cc02',
    colorDark: '#46a302',
    bg: '#ecfdf5',
    badge: 'Storage & Querying',
    titleColor: '#166534'
  },
  backend: {
    id: 'backend',
    icon: Server,
    color: '#1cb0f6',
    colorDark: '#1899d6',
    bg: '#eff6ff',
    badge: 'APIs & Microservices',
    titleColor: '#1e40af'
  },
  'oop-api-design': {
    id: 'oop-api-design',
    icon: Layers,
    color: '#af67e9',
    colorDark: '#9047cf',
    bg: '#f3e8ff',
    badge: 'OOP & Patterns',
    titleColor: '#6b21a8'
  },
  dsa: {
    id: 'dsa',
    icon: Binary,
    color: '#ffc800',
    colorDark: '#e5a400',
    bg: '#fefce8',
    badge: 'Algorithms & Structures',
    titleColor: '#854d0e'
  },
  'system-design': {
    id: 'system-design',
    icon: Cpu,
    color: '#06b6d4',
    colorDark: '#0891b2',
    bg: '#ecfeff',
    badge: 'Distributed Architecture',
    titleColor: '#155e75'
  },
  'ai-engineering': {
    id: 'ai-engineering',
    icon: Bot,
    color: '#ff4b4b',
    colorDark: '#ea2b2b',
    bg: '#fff1f2',
    badge: 'RAG & AI Agents',
    titleColor: '#9f1239'
  }
};

export function getTopicTheme(topicId) {
  return TOPIC_THEMES[topicId] || TOPIC_THEMES.databases;
}

// Stable stage-ID → presentation palette (subtle background tints only).
// Titles, descriptions and ordering always come from the manifest — these
// entries never add content, just colors. Unmapped stage IDs cycle the
// fallback palette by position.
const STAGE_PALETTE = [
  { bg: '#f0f9ff', border: '#bae6fd', accent: '#0284c7', textColor: '#0c4a6e' }, // sky
  { bg: '#fffbeb', border: '#fde68a', accent: '#d97706', textColor: '#92400e' }, // amber
  { bg: '#faf5ff', border: '#e9d5ff', accent: '#9333ea', textColor: '#6b21a8' }, // violet
  { bg: '#f0fdf4', border: '#bbf7d0', accent: '#16a34a', textColor: '#14532d' }, // emerald
  { bg: '#fff1f2', border: '#fecaca', accent: '#e11d48', textColor: '#9f1239' }, // rose
  { bg: '#ecfeff', border: '#a5f3fc', accent: '#0891b2', textColor: '#155e75' }, // cyan
  { bg: '#f8fafc', border: '#e2e8f0', accent: '#64748b', textColor: '#334155' }, // slate
  { bg: '#f0fdfa', border: '#99f6e4', accent: '#0d9488', textColor: '#115e59' }, // teal
];

const STAGE_THEMES = {
  'sql-relational-foundations': 0,
  'transactions-concurrency': 1,
  'indexes-query-performance': 2,
  'database-internals': 6,
  'caching': 4,
  'database-choice-and-scaling': 3,
  'production-operations': 5,
  'ai-ml-foundations': 2,
  'python-data-backend': 7,
};

/**
 * Presentation tint for a stage. `fallbackIndex` (the stage's position in the
 * manifest's stage list) rotates the palette for stage IDs without a mapped
 * tint, so new stages in the content repo never render colorless.
 */
export function getStageTheme(stageId, fallbackIndex = 0) {
  const mapped = STAGE_THEMES[stageId];
  const index = Number.isInteger(mapped) ? mapped : fallbackIndex % STAGE_PALETTE.length;
  return STAGE_PALETTE[index];
}

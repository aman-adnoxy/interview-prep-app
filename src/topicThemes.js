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

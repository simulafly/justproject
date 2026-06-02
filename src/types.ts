export interface Track {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  genre: string;
  color: string; // Tailind class color for glow effects (emerald, pink, cyan, yellow)
  description: string;
  notes: SynthSettings;
}

export interface SynthSettings {
  bassSequence: number[]; // Index in a scale
  leadSequence: (number | null)[]; // Index in a scale or null/rest
  scale: number[]; // Frequencies of the notes
}

export type GridPosition = {
  x: number;
  y: number;
};

export interface GameStats {
  score: number;
  highScore: number;
  foodEaten: number;
  level: number;
  isPlaying: boolean;
  isGameOver: boolean;
}

export type ThemeType = 'green' | 'pink' | 'cyan' | 'amber';

export interface ThemeConfig {
  primary: string;
  primaryGlow: string;
  accent: string;
  bgDark: string;
  gridLine: string;
  snakeHead: string;
  snakeBody: string;
  food: string;
  visualizerBars: string;
}

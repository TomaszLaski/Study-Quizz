export type CourseId = 'react' | 'jsm' | 'patterns';

export interface QuestionOption {
  label: string;
  text: string;
  correct: boolean;
}

export interface CodeExample {
  language: string;
  code: string;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: number;
  category: string;
  difficulty: Difficulty;
  question: string;
  shortAnswer: string | null;
  answer: string;
  keyPoints: string[];
  codeExamples: CodeExample[];
  tags: string[];
  relatedQuestions: number[];
  options: QuestionOption[];
  course?: CourseId;
  sourceNum?: number;
  /** Paths under public/, e.g. "jsm-figures/q41.png" or A/B/C array */
  figure?: string | string[];
  /** Official answer key missing — check shows selection only */
  correctUnknown?: boolean;
}

export interface CourseMeta {
  id: CourseId;
  title: string;
  subtitle: string;
  icon: string;
  accent: string;
  requiresScope: boolean;
}

export const COURSES: CourseMeta[] = [
  {
    id: 'react',
    title: 'React Interview',
    subtitle: 'Pytania rekrutacyjne z React — wybierz kategorię',
    icon: '⚛️',
    accent: '#0d47a1',
    requiresScope: true,
  },
  {
    id: 'patterns',
    title: 'React Interview: Wzorce',
    subtitle: 'Wzorce + Klocki — kiedy używać, rozpoznawanie, pułapki',
    icon: '🧩',
    accent: '#6a1b9a',
    requiresScope: true,
  },
  {
    id: 'jsm',
    title: 'Jachtowy Sternik Morski',
    subtitle: 'Przykładowe pytania egzaminacyjne PZŻ — wybierz zakres',
    icon: '⛵',
    accent: '#00695c',
    requiresScope: true,
  },
];

export type QuizMode = 'all' | 'category' | 'difficult';

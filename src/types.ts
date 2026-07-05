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
}

export type QuizMode = 'all' | 'category' | 'difficult';

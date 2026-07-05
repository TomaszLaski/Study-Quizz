export interface QuestionOption {
  label: string;
  text: string;
  correct: boolean;
}

export interface Question {
  id: number;
  category: string;
  question: string;
  answer: string;
  options: QuestionOption[];
}

export type QuizMode = 'all' | 'category' | 'difficult';

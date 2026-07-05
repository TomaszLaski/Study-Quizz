import { useCallback, useMemo, useState } from 'react';
import questionsData from './data/questions.json';
import HomeScreen from './components/HomeScreen';
import QuizScreen from './components/QuizScreen';
import type { Question } from './types';
import './App.css';

const ALL_QUESTIONS = questionsData as Question[];
const DIFFICULT_KEY = 'react-quiz-difficult';

function loadDifficultIds(): number[] {
  try {
    const raw = localStorage.getItem(DIFFICULT_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

function saveDifficultIds(ids: number[]) {
  localStorage.setItem(DIFFICULT_KEY, JSON.stringify(ids));
}

export default function App() {
  const [screen, setScreen] = useState<'home' | 'quiz'>('home');
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [startIndex, setStartIndex] = useState(0);
  const [difficultIds, setDifficultIds] = useState<number[]>(loadDifficultIds);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const q of ALL_QUESTIONS) {
      map.set(q.category, (map.get(q.category) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, []);

  const difficultCount = difficultIds.length;

  const startQuiz = useCallback((questions: Question[], index = 0) => {
    setActiveQuestions(questions);
    setStartIndex(index);
    setScreen('quiz');
  }, []);

  const startAll = useCallback(() => {
    startQuiz(ALL_QUESTIONS);
  }, [startQuiz]);

  const startCategory = useCallback(
    (category: string) => {
      const filtered = ALL_QUESTIONS.filter((q) => q.category === category);
      startQuiz(filtered);
    },
    [startQuiz],
  );

  const startDifficult = useCallback(() => {
    const filtered = ALL_QUESTIONS.filter((q) => difficultIds.includes(q.id));
    startQuiz(filtered);
  }, [difficultIds, startQuiz]);

  const toggleDifficult = useCallback((id: number) => {
    setDifficultIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      saveDifficultIds(next);
      return next;
    });
  }, []);

  const exitQuiz = useCallback(() => {
    setScreen('home');
    setActiveQuestions([]);
    setStartIndex(0);
  }, []);

  if (screen === 'quiz' && activeQuestions.length > 0) {
    return (
      <QuizScreen
        questions={activeQuestions}
        initialIndex={startIndex}
        difficultIds={difficultIds}
        onToggleDifficult={toggleDifficult}
        onExit={exitQuiz}
      />
    );
  }

  return (
    <HomeScreen
      totalCount={ALL_QUESTIONS.length}
      categories={categories}
      difficultCount={difficultCount}
      onStartAll={startAll}
      onStartCategory={startCategory}
      onStartDifficult={startDifficult}
    />
  );
}

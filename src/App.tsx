import { useCallback, useMemo, useState } from 'react';
import questionsData from './data/questions.json';
import HomeScreen from './components/HomeScreen';
import QuizScreen from './components/QuizScreen';
import type { Question } from './types';
import './App.css';

const ALL_QUESTIONS = questionsData as Question[];
const DIFFICULT_KEY = 'react-quiz-difficult';
const PASSED_KEY = 'react-quiz-passed';
const LAST_KEY = 'react-quiz-last';

function loadIds(key: string): number[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

function saveIds(key: string, ids: number[]) {
  localStorage.setItem(key, JSON.stringify(ids));
}

function loadLastId(): number | null {
  try {
    const raw = localStorage.getItem(LAST_KEY);
    return raw ? (JSON.parse(raw) as number) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [screen, setScreen] = useState<'home' | 'quiz'>('home');
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [startIndex, setStartIndex] = useState(0);
  const [difficultIds, setDifficultIds] = useState<number[]>(() =>
    loadIds(DIFFICULT_KEY),
  );
  const [passedIds, setPassedIds] = useState<number[]>(() => loadIds(PASSED_KEY));
  const [lastId, setLastId] = useState<number | null>(loadLastId);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const q of ALL_QUESTIONS) {
      map.set(q.category, (map.get(q.category) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, []);

  const difficultCount = difficultIds.length;
  const passedCount = passedIds.length;

  const resumeIndex = useMemo(() => {
    if (lastId == null) return 0;
    const i = ALL_QUESTIONS.findIndex((q) => q.id === lastId);
    return i >= 0 ? i : 0;
  }, [lastId]);
  const hasProgress = resumeIndex > 0;

  const startQuiz = useCallback((questions: Question[], index = 0) => {
    setActiveQuestions(questions);
    setStartIndex(index);
    setScreen('quiz');
  }, []);

  const continueAll = useCallback(() => {
    startQuiz(ALL_QUESTIONS, resumeIndex);
  }, [startQuiz, resumeIndex]);

  const startOver = useCallback(() => {
    setLastId(ALL_QUESTIONS[0].id);
    localStorage.setItem(LAST_KEY, JSON.stringify(ALL_QUESTIONS[0].id));
    startQuiz(ALL_QUESTIONS, 0);
  }, [startQuiz]);

  const markPassed = useCallback((id: number) => {
    setPassedIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      saveIds(PASSED_KEY, next);
      return next;
    });
  }, []);

  const markProgress = useCallback((id: number) => {
    setLastId(id);
    localStorage.setItem(LAST_KEY, JSON.stringify(id));
  }, []);

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
      saveIds(DIFFICULT_KEY, next);
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
        passedIds={passedIds}
        onToggleDifficult={toggleDifficult}
        onPass={markPassed}
        onProgress={markProgress}
        onExit={exitQuiz}
      />
    );
  }

  return (
    <HomeScreen
      totalCount={ALL_QUESTIONS.length}
      categories={categories}
      difficultCount={difficultCount}
      passedCount={passedCount}
      hasProgress={hasProgress}
      resumeNumber={resumeIndex + 1}
      onContinue={continueAll}
      onStartOver={startOver}
      onStartCategory={startCategory}
      onStartDifficult={startDifficult}
    />
  );
}

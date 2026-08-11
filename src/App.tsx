import { useCallback, useEffect, useMemo, useState } from 'react';
import reactQuestionsData from './data/questions.json';
import jsmQuestionsData from './data/jsm-questions.json';
import patternsQuestionsData from './data/patterns-questions.json';
import CoursePicker from './components/CoursePicker';
import HomeScreen from './components/HomeScreen';
import QuizScreen from './components/QuizScreen';
import type { CourseId, Question } from './types';
import { COURSES } from './types';
import './App.css';

const QUESTIONS_BY_COURSE: Record<CourseId, Question[]> = {
  react: reactQuestionsData as Question[],
  jsm: jsmQuestionsData as Question[],
  patterns: patternsQuestionsData as Question[],
};

/** Share-only JSM entry: #/jsm or ?course=jsm — no way back to other courses. */
function getStandaloneCourse(): CourseId | null {
  const params = new URLSearchParams(window.location.search);
  if (params.get('course') === 'jsm') return 'jsm';

  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  if (hash === 'jsm' || hash.startsWith('jsm/')) return 'jsm';

  return null;
}

function storageKey(course: CourseId, kind: 'difficult' | 'passed' | 'last') {
  return `quiz-${course}-${kind}`;
}

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

function loadLastId(course: CourseId): number | null {
  try {
    const raw = localStorage.getItem(storageKey(course, 'last'));
    return raw ? (JSON.parse(raw) as number) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const standaloneCourse = useMemo(() => getStandaloneCourse(), []);
  const [screen, setScreen] = useState<'courses' | 'home' | 'quiz'>(
    standaloneCourse ? 'home' : 'courses',
  );
  const [courseId, setCourseId] = useState<CourseId | null>(standaloneCourse);
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [startIndex, setStartIndex] = useState(0);
  const [difficultIds, setDifficultIds] = useState<number[]>(() =>
    standaloneCourse ? loadIds(storageKey(standaloneCourse, 'difficult')) : [],
  );
  const [passedIds, setPassedIds] = useState<number[]>(() =>
    standaloneCourse ? loadIds(storageKey(standaloneCourse, 'passed')) : [],
  );
  const [lastId, setLastId] = useState<number | null>(() =>
    standaloneCourse ? loadLastId(standaloneCourse) : null,
  );

  useEffect(() => {
    if (standaloneCourse === 'jsm') {
      document.title = 'Jachtowy Sternik Morski — Study Quizz';
    }
  }, [standaloneCourse]);

  const course = useMemo(
    () => COURSES.find((c) => c.id === courseId) ?? null,
    [courseId],
  );

  const allQuestions = courseId ? QUESTIONS_BY_COURSE[courseId] : [];

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const q of allQuestions) {
      map.set(q.category, (map.get(q.category) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'pl'));
  }, [allQuestions]);

  const resumeIndex = useMemo(() => {
    if (lastId == null) return 0;
    const i = allQuestions.findIndex((q) => q.id === lastId);
    return i >= 0 ? i : 0;
  }, [lastId, allQuestions]);
  const hasProgress = resumeIndex > 0;

  const courseCounts = useMemo(
    () => ({
      react: QUESTIONS_BY_COURSE.react.length,
      jsm: QUESTIONS_BY_COURSE.jsm.length,
      patterns: QUESTIONS_BY_COURSE.patterns.length,
    }),
    [],
  );

  const selectCourse = useCallback((id: CourseId) => {
    setCourseId(id);
    setDifficultIds(loadIds(storageKey(id, 'difficult')));
    setPassedIds(loadIds(storageKey(id, 'passed')));
    setLastId(loadLastId(id));
    setScreen('home');
  }, []);

  const backToCourses = useCallback(() => {
    if (standaloneCourse) return;
    setScreen('courses');
    setCourseId(null);
    setActiveQuestions([]);
    setStartIndex(0);
  }, [standaloneCourse]);

  const startQuiz = useCallback((questions: Question[], index = 0) => {
    if (questions.length === 0) return;
    setActiveQuestions(questions);
    setStartIndex(index);
    setScreen('quiz');
  }, []);

  const continueAll = useCallback(() => {
    startQuiz(allQuestions, resumeIndex);
  }, [startQuiz, allQuestions, resumeIndex]);

  const startOver = useCallback(() => {
    if (!courseId || allQuestions.length === 0) return;
    setLastId(allQuestions[0].id);
    localStorage.setItem(storageKey(courseId, 'last'), JSON.stringify(allQuestions[0].id));
    startQuiz(allQuestions, 0);
  }, [startQuiz, allQuestions, courseId]);

  const startAllWithScope = useCallback(
    (scope: string | 'all') => {
      if (!courseId) return;
      const filtered =
        scope === 'all' ? allQuestions : allQuestions.filter((q) => q.category === scope);
      if (filtered.length === 0) return;
      setLastId(filtered[0].id);
      localStorage.setItem(storageKey(courseId, 'last'), JSON.stringify(filtered[0].id));
      startQuiz(filtered, 0);
    },
    [allQuestions, courseId, startQuiz],
  );

  const markPassed = useCallback(
    (id: number) => {
      if (!courseId) return;
      setPassedIds((prev) => {
        if (prev.includes(id)) return prev;
        const next = [...prev, id];
        saveIds(storageKey(courseId, 'passed'), next);
        return next;
      });
    },
    [courseId],
  );

  const markProgress = useCallback(
    (id: number) => {
      if (!courseId) return;
      setLastId(id);
      localStorage.setItem(storageKey(courseId, 'last'), JSON.stringify(id));
    },
    [courseId],
  );

  const startCategory = useCallback(
    (category: string) => {
      const filtered = allQuestions.filter((q) => q.category === category);
      startQuiz(filtered);
    },
    [startQuiz, allQuestions],
  );

  const startDifficult = useCallback(() => {
    const filtered = allQuestions.filter((q) => difficultIds.includes(q.id));
    startQuiz(filtered);
  }, [difficultIds, startQuiz, allQuestions]);

  const toggleDifficult = useCallback(
    (id: number) => {
      if (!courseId) return;
      setDifficultIds((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        saveIds(storageKey(courseId, 'difficult'), next);
        return next;
      });
    },
    [courseId],
  );

  const exitQuiz = useCallback(() => {
    setScreen('home');
    setActiveQuestions([]);
    setStartIndex(0);
  }, []);

  if (screen === 'courses') {
    if (standaloneCourse) {
      // Should not happen — keep user inside locked course
      return null;
    }
    return <CoursePicker onSelect={selectCourse} counts={courseCounts} />;
  }

  if (screen === 'quiz' && activeQuestions.length > 0 && course) {
    return (
      <QuizScreen
        questions={activeQuestions}
        initialIndex={startIndex}
        course={course}
        difficultIds={difficultIds}
        passedIds={passedIds}
        onToggleDifficult={toggleDifficult}
        onPass={markPassed}
        onProgress={markProgress}
        onExit={exitQuiz}
      />
    );
  }

  if (!course) {
    if (standaloneCourse) return null;
    return <CoursePicker onSelect={selectCourse} counts={courseCounts} />;
  }

  return (
    <HomeScreen
      course={course}
      totalCount={allQuestions.length}
      categories={categories}
      difficultCount={difficultIds.length}
      passedCount={passedIds.length}
      hasProgress={hasProgress}
      resumeNumber={resumeIndex + 1}
      requiresScope={course.requiresScope}
      hideBack={Boolean(standaloneCourse)}
      onBack={backToCourses}
      onContinue={continueAll}
      onStartOver={startOver}
      onStartCategory={startCategory}
      onStartDifficult={startDifficult}
      onStartAllWithScope={startAllWithScope}
    />
  );
}

import type { CourseId, CourseMeta } from '../types';
import { COURSES } from '../types';
import './CoursePicker.css';

interface CoursePickerProps {
  onSelect: (courseId: CourseId) => void;
  counts: Record<CourseId, number>;
}

export default function CoursePicker({ onSelect, counts }: CoursePickerProps) {
  return (
    <div className="home-page">
      <div className="home-card course-picker-card">
        <div className="home-hero">
          <h1>Quizy egzaminacyjne</h1>
          <p>Wybierz kurs, którego chcesz się uczyć.</p>
        </div>

        <div className="course-grid">
          {COURSES.map((course: CourseMeta) => (
            <button
              key={course.id}
              type="button"
              className="course-card"
              style={{ ['--course-accent' as string]: course.accent }}
              onClick={() => onSelect(course.id)}
            >
              <span className="course-card-icon" aria-hidden="true">
                {course.icon}
              </span>
              <span className="course-card-title">{course.title}</span>
              <span className="course-card-sub">{course.subtitle}</span>
              <span className="course-card-count">{counts[course.id]} pytań</span>
              {course.requiresScope && (
                <span className="course-card-badge">Wymaga wyboru zakresu</span>
              )}
            </button>
          ))}
        </div>

        <footer className="home-credit course-author">
          Autor:{' '}
          <a
            href="https://www.linkedin.com/in/tomasz-%C5%82aski-7888b2185/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Tomasz Łaski
          </a>
        </footer>
      </div>
    </div>
  );
}

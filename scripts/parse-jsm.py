"""Improved JSM question parser from PZŻ sample exam PDF text."""
from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path

EXTRACT_DIR = Path(r"C:\Users\Tomasz\react-interview-quiz\scripts\pdf-extract")
OUT_JSON = Path(r"C:\Users\Tomasz\react-interview-quiz\src\data\jsm-questions.json")

SCOPE_ALIASES = {
    "JACHTY ŻAGLOWE MORSKIE": "Jachty żaglowe morskie",
    "LOCJA": "Locja",
    "METEOROLOGIA": "Meteorologia",
    "NAWIGACJA": "Nawigacja",
    "MPZZM": "MPZZM (przepisy)",
    "RATOWNICTWO": "Ratownictwo",
    "PLANOWANIE REJSÓW": "Planowanie rejsów",
    "SYGNALIZACJA I ŁĄCZNOŚĆ": "Sygnalizacja i łączność",
    "SOLAS": "Ratownictwo",
    "NIEBEZPIECZEŃSTWIE I ZAWIADOMIENIE W": "Sygnalizacja i łączność",
}


def load_text() -> str:
    files = list(EXTRACT_DIR.glob("584106416*.txt"))
    if not files:
        raise SystemExit("Missing extracted PDF text")
    return files[0].read_text(encoding="utf-8")


def normalize(text: str) -> str:
    text = re.sub(r"Numer arkusza:.*", "", text)
    text = re.sub(r"POLSKI ZWIĄZEK ŻEGLARSKI", "", text)
    text = re.sub(r"Egzamin:.*", "", text)
    text = text.replace("-----PAGE-----", "\n")
    # Fix common glued patterns: "gazowa? A W oddzielnym" / "należy: A Luzować"
    text = re.sub(r"([?:])\s*A\s+", r"\1\nA ", text)
    text = re.sub(r"([.])\s*A\s+", r"\1\nA ", text)
    text = re.sub(r'"\s*A\s+', '"\nA ', text)
    return text


def is_scope(s: str) -> bool:
    if "?" in s or len(s) > 70:
        return False
    if re.match(r"^\d+\.", s):
        return False
    if s in {"A", "B", "C"} or re.match(r"^[ABC]\s", s):
        return False
    letters = [c for c in s if c.isalpha()]
    if len(letters) < 4:
        return False
    upper = sum(1 for c in letters if c.isupper())
    return upper / len(letters) > 0.85


def option_start(s: str) -> str | None:
    if s in {"A", "B", "C"}:
        return s
    m = re.match(r"^([ABC])\s+(.*)$", s)
    if m:
        return m.group(1)
    return None


def parse(text: str) -> list[dict]:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    current_scope = "Ogólne"
    questions: list[dict] = []
    i = 0

    while i < len(lines):
        line = lines[i]
        if is_scope(line):
            current_scope = line
            i += 1
            continue

        m = re.match(r"^(\d+)\.\s*(.*)$", line)
        if not m:
            i += 1
            continue

        qnum = int(m.group(1))
        qparts: list[str] = []
        rest = m.group(2).strip()
        # Handle "12. question? A option..."
        if rest:
            glued = re.match(r"^(.*?[?:])\s*A\s+(.*)$", rest)
            if glued:
                qparts.append(glued.group(1))
                lines[i] = f"A {glued.group(2)}"
            else:
                glued2 = re.match(r"^(.*[.\"])\s*A\s+(.*)$", rest)
                if glued2 and len(glued2.group(1)) > 15:
                    qparts.append(glued2.group(1))
                    lines[i] = f"A {glued2.group(2)}"
                else:
                    qparts.append(rest)
                    i += 1
        else:
            i += 1

        if not (qparts and lines[i].startswith("A")):
            while i < len(lines):
                if option_start(lines[i]) == "A" or is_scope(lines[i]) or re.match(r"^\d+\.", lines[i]):
                    break
                qparts.append(lines[i])
                i += 1

        options: dict[str, str] = {}
        for label in ("A", "B", "C"):
            if i >= len(lines):
                break
            start = option_start(lines[i])
            if start != label:
                break
            parts: list[str] = []
            if lines[i] != label:
                parts.append(re.sub(rf"^{label}\s+", "", lines[i]))
            i += 1
            while i < len(lines):
                nxt = option_start(lines[i])
                if nxt and nxt != label:
                    break
                if re.match(r"^\d+\.", lines[i]) or is_scope(lines[i]):
                    break
                parts.append(lines[i])
                i += 1
            options[label] = re.sub(r"\s+", " ", " ".join(parts)).strip()

        question_text = re.sub(r"\s+", " ", " ".join(qparts)).strip()
        if question_text and len(options) == 3:
            scope_key = current_scope
            # Fix broken scope from mid-title wrap
            if "NIEBEZPIECZE" in scope_key.upper():
                scope_key = "SYGNALIZACJA I ŁĄCZNOŚĆ"
            if scope_key == "SOLAS":
                scope_key = "RATOWNICTWO"
            display = SCOPE_ALIASES.get(scope_key, scope_key.title())
            questions.append(
                {
                    "num": qnum,
                    "scope": display,
                    "scopeRaw": scope_key,
                    "question": question_text,
                    "options": options,
                }
            )
        else:
            print(f"SKIP Q{qnum} opts={list(options.keys())} {question_text[:70]!r}")

    return questions


def main() -> None:
    text = normalize(load_text())
    questions = parse(text)
    # Deduplicate by question number (keep first complete)
    by_num: dict[int, dict] = {}
    for q in questions:
        by_num.setdefault(q["num"], q)
    questions = [by_num[n] for n in sorted(by_num)]

    print(f"Parsed {len(questions)} unique questions")
    print("By scope:")
    for s, n in Counter(q["scope"] for q in questions).most_common():
        print(f"  {n:3} {s}")

    # Convert to app format — correct answer unknown from PDF,
    # mark none as correct; runtime can still show options.
    # We'll fill correctIndex later if answer key available.
    app_questions = []
    for idx, q in enumerate(questions, start=1):
        opts = []
        for label in ("A", "B", "C"):
            opts.append({"label": label, "text": q["options"][label], "correct": False})
        app_questions.append(
            {
                "id": idx,
                "sourceNum": q["num"],
                "category": q["scope"],
                "course": "jsm",
                "difficulty": "medium",
                "question": q["question"],
                "shortAnswer": None,
                "answer": "Oficjalny klucz odpowiedzi nie jest dołączony do przykładowego arkusza PZŻ. Porównaj wybraną odpowiedź z materiałami szkoleniowymi / podręcznikiem.",
                "keyPoints": [],
                "codeExamples": [],
                "tags": ["jsm", q["scope"]],
                "relatedQuestions": [],
                "options": opts,
                "correctUnknown": True,
            }
        )

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(app_questions, ensure_ascii=False, indent=2), encoding="utf-8")
    print("wrote", OUT_JSON)

    # Also dump raw for debugging
    raw = Path(r"C:\Users\Tomasz\react-interview-quiz\scripts\jsm-raw.json")
    raw.write_text(json.dumps(questions, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()

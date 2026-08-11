"""
Apply JSM answer key from JSM_klucz_odpowiedzi.md onto jsm-questions.json.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(r"C:\Users\Tomasz\react-interview-quiz")
DATA = ROOT / "src" / "data" / "jsm-questions.json"
KEY = Path(r"C:\Users\Tomasz\Downloads\JSM_klucz_odpowiedzi.md")

ROW_RE = re.compile(
    r"^\|\s*(\d+)\s*(?:⚠)?\s*\|\s*\*\*([ABC])\*\*\s*\|\s*(.+?)\s*\|\s*$"
)
SKIP_RE = re.compile(
    r"^\|\s*(\d+)\s*(?:⚠)?\s*\|\s*—\s*\|\s*(.+?)\s*\|\s*$"
)


def parse_key(path: Path) -> tuple[dict[int, tuple[str, str]], set[int]]:
    answers: dict[int, tuple[str, str]] = {}
    skipped: set[int] = set()
    for line in path.read_text(encoding="utf-8").splitlines():
        m = ROW_RE.match(line)
        if m:
            num = int(m.group(1))
            letter = m.group(2)
            reason = m.group(3).strip()
            answers[num] = (letter, reason)
            continue
        m2 = SKIP_RE.match(line)
        if m2:
            skipped.add(int(m2.group(1)))
    return answers, skipped


def main() -> None:
    answers, skipped = parse_key(KEY)
    questions = json.loads(DATA.read_text(encoding="utf-8"))

    applied = 0
    unknown = 0
    missing_opts = 0

    for q in questions:
        src = q.get("sourceNum")
        if src in skipped or src not in answers:
            q["correctUnknown"] = True
            for opt in q["options"]:
                opt["correct"] = False
            if not q.get("answer"):
                q["answer"] = (
                    "Brak pewnego klucza w arkuszu (rysunek / odczyt nieczytelny). "
                    "Zweryfikuj z oryginalnym PDF / materiałami szkoleniowymi."
                )
            unknown += 1
            continue

        letter, reason = answers[src]
        labels = {o["label"] for o in q["options"]}
        if letter not in labels:
            q["correctUnknown"] = True
            for opt in q["options"]:
                opt["correct"] = False
            missing_opts += 1
            unknown += 1
            continue

        for opt in q["options"]:
            opt["correct"] = opt["label"] == letter
        q["correctUnknown"] = False
        correct_text = next(o["text"] for o in q["options"] if o["correct"])
        q["shortAnswer"] = correct_text
        q["answer"] = f"**Poprawna odpowiedź: {letter}.** {correct_text}\n\n{reason}"
        q["keyPoints"] = [f"Odpowiedź: {letter}", reason]
        applied += 1

    DATA.write_text(json.dumps(questions, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Key entries: {len(answers)} | skipped in key: {sorted(skipped)}")
    print(f"Applied: {applied} | unknown: {unknown} | missing option letter: {missing_opts}")
    print(f"Total questions: {len(questions)}")


if __name__ == "__main__":
    main()

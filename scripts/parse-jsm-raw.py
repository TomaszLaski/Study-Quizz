from pathlib import Path
import re
import json

text = Path(r"C:\Users\Tomasz\react-interview-quiz\scripts\pdf-extract").glob("584106416*.txt").__next__().read_text(encoding="utf-8")

# Normalize page markers and footer noise
text = re.sub(r"Numer arkusza:.*", "", text)
text = re.sub(r"POLSKI ZWIĄZEK ŻEGLARSKI", "", text)
text = re.sub(r"Egzamin:.*", "", text)
text = text.replace("-----PAGE-----", "\n")

# Known scopes (zakresy) from PZŻ JSM exam
KNOWN = [
    "JACHTY ŻAGLOWE MORSKIE",
    "LOCJA",
    "METEOROLOGIA",
    "NAWIGACJA",
    "RATOWNICTWO",
    "PLANOWANIE REJSÓW",
    "SYGNALIZACJA I ŁĄCZNOŚĆ",
    "PRZEPISY",
    "TEORIA ŻEGLOWANIA",
    "MANEWROWANIE",
]

# Find all uppercase-ish headers that look like scopes
headers_found = set()
for line in text.splitlines():
    s = line.strip()
    if re.match(r"^[A-ZĄĆĘŁŃÓŚŹŻ][A-ZĄĆĘŁŃÓŚŹŻ0-9\s\-–,/()]{3,}$", s):
        if not s.startswith(("A ", "B ", "C ")) and len(s) < 80:
            headers_found.add(s)

print("HEADERS FOUND:")
for h in sorted(headers_found):
    print(" ", h)

# Join lines for parsing - PDF extraction breaks lines mid-sentence
# Strategy: find question starts "N. " and answer options A/B/C

# Clean repeated spaces
raw_lines = [ln.rstrip() for ln in text.splitlines()]

# Build a stream of non-empty lines
lines = [ln.strip() for ln in raw_lines if ln.strip()]

current_scope = "Ogólne"
questions = []
i = 0

def is_scope(s: str) -> bool:
    # Scope titles are ALL CAPS (Polish), short, no trailing question mark
    if "?" in s:
        return False
    if re.match(r"^\d+\.", s):
        return False
    if s in ("A", "B", "C"):
        return False
    if re.match(r"^[ABC]\s", s):
        return False
    # mostly uppercase letters
    letters = [c for c in s if c.isalpha()]
    if len(letters) < 4:
        return False
    upper = sum(1 for c in letters if c.isupper())
    return upper / len(letters) > 0.85 and len(s) < 70

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
    qparts = [m.group(2)] if m.group(2) else []
    i += 1

    # Collect question text until we hit A option
    while i < len(lines):
        if re.match(r"^A\s+", lines[i]) or lines[i] == "A":
            break
        if is_scope(lines[i]):
            break
        if re.match(r"^\d+\.\s*", lines[i]):
            break
        qparts.append(lines[i])
        i += 1

    options = {}
    for label in ("A", "B", "C"):
        if i >= len(lines):
            break
        # Option may start as "A text" or "A" alone then text
        if lines[i] == label or re.match(rf"^{label}\s+", lines[i]):
            opt_parts = []
            if lines[i] != label:
                opt_parts.append(re.sub(rf"^{label}\s+", "", lines[i]))
            i += 1
            while i < len(lines):
                # next option / next question / scope
                if lines[i] in ("A", "B", "C") or re.match(r"^[ABC]\s+", lines[i]):
                    # only break if it's a different/next label
                    nxt = lines[i][0]
                    if nxt in ("A", "B", "C"):
                        # if same label continuing somehow, rare
                        expected_next = {"A": "B", "B": "C", "C": None}[label]
                        if nxt == expected_next or (label == "C" and (re.match(r"^\d+\.", lines[i]) or is_scope(lines[i]))):
                            break
                        if nxt != label:
                            break
                if re.match(r"^\d+\.\s*", lines[i]) or is_scope(lines[i]):
                    break
                opt_parts.append(lines[i])
                i += 1
            options[label] = " ".join(opt_parts).strip()
        else:
            break

    question_text = " ".join(qparts).strip()
    question_text = re.sub(r"\s+", " ", question_text)
    for k in list(options):
        options[k] = re.sub(r"\s+", " ", options[k]).strip()

    if question_text and len(options) == 3:
        questions.append({
            "num": qnum,
            "scope": current_scope,
            "question": question_text,
            "options": options,
        })
    else:
        print(f"SKIP incomplete Q{qnum} scope={current_scope} opts={list(options)} text={question_text[:60]!r}")

print(f"\nParsed {len(questions)} questions")
from collections import Counter
scopes = Counter(q["scope"] for q in questions)
print("By scope:")
for s, n in scopes.most_common():
    print(f"  {n:3} {s}")

# Sample
print("\nSample Q1:")
print(json.dumps(questions[0], ensure_ascii=False, indent=2))
print("\nSample mid:")
print(json.dumps(questions[len(questions)//2], ensure_ascii=False, indent=2))

out = Path(r"C:\Users\Tomasz\react-interview-quiz\scripts\jsm-raw.json")
out.write_text(json.dumps(questions, ensure_ascii=False, indent=2), encoding="utf-8")
print("wrote", out)

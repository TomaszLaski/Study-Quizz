from pathlib import Path
import re
from collections import Counter

p = Path(r"C:\Users\Tomasz\react-interview-quiz\scripts\pdf-extract")
files = list(p.glob("584106416*.txt"))
print("files:", [f.name for f in files])
text = files[0].read_text(encoding="utf-8")
lines = text.splitlines()

headers = []
for line in lines:
    s = line.strip()
    if not s:
        continue
    if s.startswith("Numer arkusza") or s.startswith("-----PAGE") or s.startswith("POLSKI") or s.startswith("Egzamin"):
        continue
    if re.match(r"^\d+\.", s):
        continue
    if re.match(r"^[A-ZĄĆĘŁŃÓŚŹŻ0-9][A-ZĄĆĘŁŃÓŚŹŻ0-9\s\-–,/()]{6,}$", s) and not s.startswith("A ") and not s.startswith("B ") and not s.startswith("C "):
        headers.append(s)

c = Counter(headers)
for h, n in c.most_common(50):
    print(f"{n:3} | {h}")

print("---")
print("total lines", len(lines), "chars", len(text))

# Show unique section-like lines that appear near start of pages
print("\n=== first non-empty lines after PAGE markers ===")
pages = text.split("-----PAGE-----")
for i, page in enumerate(pages[:15]):
    for line in page.splitlines():
        s = line.strip()
        if not s or s.startswith("Numer") or s.startswith("POLSKI") or s.startswith("Egzamin"):
            continue
        if re.match(r"^\d+\.", s):
            print(f"page {i+1}: (starts with Q) {s[:80]}")
            break
        print(f"page {i+1}: {s[:100]}")
        break

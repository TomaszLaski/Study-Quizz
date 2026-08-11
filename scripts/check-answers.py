from pathlib import Path
import re

text = Path(r"C:\Users\Tomasz\react-interview-quiz\scripts\pdf-extract").glob("584106416*.txt").__next__().read_text(encoding="utf-8")

# Look for answer key patterns
for pat in [r"odpowiedzi", r"klucz", r"prawidłowa", r"poprawn", r"facit", r"answers"]:
    matches = list(re.finditer(pat, text, re.I))
    print(pat, "->", len(matches))
    for m in matches[:3]:
        start = max(0, m.start() - 40)
        end = min(len(text), m.end() + 80)
        print(" ", repr(text[start:end]))

# Last pages content
pages = text.split("-----PAGE-----")
print("\nTotal pages chunks:", len(pages))
print("\n=== LAST PAGE ===")
print(pages[-1][:3000])
print("\n=== PAGE -2 ===")
print(pages[-2][:2000] if len(pages) > 1 else "n/a")

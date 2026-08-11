from pathlib import Path
from pypdf import PdfReader

desktop = Path(r"C:\Users\Tomasz\Desktop")
out = Path(r"C:\Users\Tomasz\react-interview-quiz\scripts\pdf-extract")
out.mkdir(parents=True, exist_ok=True)

paths = [
    desktop / "584106416-przykładowe-pytania-egzaminacyjne-jachtowy-sternik-morski.pdf",
    desktop / "584835565-pytania-egzaminacyjne-jsm.pdf",
]

for p in paths:
    print("===", p.name, "===")
    reader = PdfReader(str(p))
    print("pages:", len(reader.pages))
    texts = []
    for i, page in enumerate(reader.pages):
        t = page.extract_text() or ""
        texts.append(t)
        if i < 3:
            print(f"--- page {i+1} preview ({len(t)} chars) ---")
            print(t[:2000])
            print()
    full = "\n\n-----PAGE-----\n\n".join(texts)
    dest = out / (p.stem[:50] + ".txt")
    dest.write_text(full, encoding="utf-8")
    nonempty = sum(1 for t in texts if t.strip())
    print("wrote", dest.name, "chars", len(full), "nonempty pages", nonempty)
    print()

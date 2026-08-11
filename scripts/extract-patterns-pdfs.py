from pathlib import Path
from pypdf import PdfReader

desktop = Path(r"C:\Users\Tomasz\Desktop")
out = Path(r"C:\Users\Tomasz\react-interview-quiz\scripts\pdf-extract")
out.mkdir(parents=True, exist_ok=True)

paths = [
    desktop / "wzorce-komplet-A1-A10.pdf",
    desktop / "klocki-komplet-B1-B7.pdf",
]

for p in paths:
    print("===", p.name, "===")
    reader = PdfReader(str(p))
    print("pages:", len(reader.pages))
    texts = []
    for i, page in enumerate(reader.pages):
        t = page.extract_text() or ""
        texts.append(t)
        if i < 2:
            print(f"--- page {i+1} ({len(t)} chars) ---")
            print(t[:2500])
            print()
    full = "\n\n-----PAGE-----\n\n".join(texts)
    dest = out / (p.stem + ".txt")
    dest.write_text(full, encoding="utf-8")
    nonempty = sum(1 for t in texts if t.strip())
    print("wrote", dest.name, "chars", len(full), "nonempty", nonempty)
    print()

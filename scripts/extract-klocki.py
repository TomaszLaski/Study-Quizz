from pathlib import Path
from pypdf import PdfReader

p = Path(r"C:\Users\Tomasz\Desktop\klocki-komplet-B1-B7.pdf")
out = Path(r"C:\Users\Tomasz\react-interview-quiz\scripts\pdf-extract\klocki-komplet-B1-B7.txt")
reader = PdfReader(str(p))
texts = [(page.extract_text() or "") for page in reader.pages]
out.write_text("\n\n-----PAGE-----\n\n".join(texts), encoding="utf-8")
print("pages", len(texts), "chars", len(out.read_text(encoding="utf-8")))

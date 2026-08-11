import pymupdf
from pathlib import Path

pdf = Path(r"C:\Users\Tomasz\Desktop\584835565-pytania-egzaminacyjne-jsm.pdf")
out = Path(r"C:\Users\Tomasz\react-interview-quiz\scripts\pdf-extract")
doc = pymupdf.open(str(pdf))
print("pages", doc.page_count)
for i in [0, 1, 6, 12]:
    page = doc[i]
    pix = page.get_pixmap(matrix=pymupdf.Matrix(1.5, 1.5))
    dest = out / f"jsm-scan-page-{i+1}.png"
    pix.save(str(dest))
    print("saved", dest, pix.width, pix.height)

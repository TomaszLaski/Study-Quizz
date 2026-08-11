import json
from pathlib import Path
from collections import Counter

q = json.loads(
    Path(r"C:\Users\Tomasz\react-interview-quiz\src\data\patterns-questions.json").read_text(
        encoding="utf-8"
    )
)
print("count", len(q))
for cat, n in Counter(x["category"] for x in q).most_common():
    print(f"{n:3} {cat.encode('ascii', 'replace').decode()}")
print("sample id1 options correct:", [o["label"] for o in q[0]["options"] if o["correct"]])

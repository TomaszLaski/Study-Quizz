from pathlib import Path
import json

raw = json.loads(Path(r"C:\Users\Tomasz\react-interview-quiz\scripts\jsm-raw.json").read_text(encoding="utf-8"))
# Print compact list for manual keying
for q in raw:
    opts = " | ".join(f"{k}:{v[:50]}" for k, v in q["options"].items())
    print(f"{q['num']}|{q['scope']}|{q['question'][:90]}")
    print(f"   {opts[:200]}")

from pathlib import Path

p = Path(r"C:\Users\Tomasz\react-interview-quiz\scripts\generate-patterns.py")
t = p.read_text(encoding="utf-8")
# Keep def opts, replace call sites options=opts( -> options=next_opts(
# but not the function definition
lines = []
for line in t.splitlines(keepends=True):
    if "def opts(" in line or "return opts(" in line:
        lines.append(line)
    else:
        lines.append(line.replace("options=opts(", "options=next_opts("))
p.write_text("".join(lines), encoding="utf-8")
print("done", "".join(lines).count("options=next_opts("))

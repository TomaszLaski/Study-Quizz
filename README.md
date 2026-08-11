# Study Quizz

Aplikacja do nauki z trzema kursami:

1. **React Interview** — pytania rekrutacyjne z React
2. **React Interview: Wzorce** — wzorce + klocki (kiedy używać, rozpoznawanie)
3. **Jachtowy Sternik Morski** — przykładowe pytania egzaminacyjne PZŻ

## GitHub Pages

https://tomaszlaski.github.io/Study-Quizz/

Deploy: push na `main` → workflow `.github/workflows/deploy.yml`.

W ustawieniach repo: **Settings → Pages → Source: GitHub Actions**.

## Uruchomienie lokalne (Git Bash)

```bash
cd /c/Users/Tomasz/react-interview-quiz
npm install
npm run dev
```

Aplikacja: `http://127.0.0.1:5173/`

## Regeneracja pytań

```bash
npm run parse           # React Q&A
npm run parse:patterns  # Wzorce
npm run parse:jsm       # JSM + klucz odpowiedzi
```

Źródło React: [sudheerj/reactjs-interview-questions](https://github.com/sudheerj/reactjs-interview-questions) (MIT).

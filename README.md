# React Interview Quiz

Aplikacja do nauki pytań rekrutacyjnych z React — w stylu quizu z pytaniami i odpowiedziami.

Źródło pytań: [sudheerj/reactjs-interview-questions](https://github.com/sudheerj/reactjs-interview-questions)

## Uruchomienie (Git Bash)

```bash
cd /c/Users/Tomasz/react-interview-quiz
npm install
npm run dev
```

Aplikacja będzie dostępna pod adresem `http://localhost:5173`.

## Aktualizacja pytań z GitHub

```bash
cd /c/Users/Tomasz/react-interview-quiz
rm scripts/README.md
npm run parse
```

## Funkcje

- 400+ pytań z odpowiedziami
- Każde pytanie ma 3 opcje: 1 poprawna i 2 błędne (A/B/C)
- Nauka wszystkich pytań lub wybranej kategorii
- Sprawdzanie odpowiedzi i pełne wyjaśnienie po weryfikacji
- Oznaczanie trudnych pytań (zapis w `localStorage`)
- Nawigacja: poprzednie / następne pytanie

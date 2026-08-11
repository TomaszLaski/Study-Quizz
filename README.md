# Quizy egzaminacyjne

Aplikacja do nauki z trzema kursami:

1. **React Interview** — pytania rekrutacyjne z React
2. **React Interview: Wzorce** — A1–A10 + B1–B7 (kiedy używać, rozpoznawanie, klocki)
3. **Jachtowy Sternik Morski** — przykładowe pytania egzaminacyjne PZŻ

## Uruchomienie (Git Bash)

```bash
cd /c/Users/Tomasz/react-interview-quiz
npm install
npm run dev
```

Aplikacja: `http://127.0.0.1:5173/`

## Kurs: React Interview: Wzorce

Na podstawie PDF-ów:
- `wzorce-komplet-A1-A10.pdf`
- `klocki-komplet-B1-B7.pdf`

Zakresy (wymagany wybór przed startem):
- Rozpoznawanie (kiedy używać) — scenariusze jak z rozmowy + słowa-klucze
- Wzorce A1–A5 / A6–A10
- Klocki B1–B3 / B4–B7
- Klocki → wzorce (kompozycja)
- Porównania i pułapki (A2 vs A5, A3 vs A7, …)
- Architektura (container, lifting state, hooks, compound, reducer)

Zasada z materiału: najpierw **słowa-klucze** (dowód), potem **nazwa wzorca** (wniosek).

```bash
npm run parse:patterns
```

## Kurs JSM

```bash
npm run parse:jsm
```

## Kurs React (Q&A)

Źródło: [sudheerj/reactjs-interview-questions](https://github.com/sudheerj/reactjs-interview-questions) (MIT).

```bash
npm run parse
```

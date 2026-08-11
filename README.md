# Study Quizz

Aplikacja quizowa do nauki — trzy kursy, pytania wielokrotnego wyboru (A/B/C).

## Kursy

### 1. React Interview
Pytania rekrutacyjne z React (Q&A + test).  
Źródło: [sudheerj/reactjs-interview-questions](https://github.com/sudheerj/reactjs-interview-questions) (MIT).

### 2. React Interview: Wzorce
Trening rozpoznawania **wzorców UI / architektury frontendu** — kiedy którego użyć, jak odróżnić podobne oraz z jakich klocków je składać.

**Wzorce-komponenty**
- Debounced async search
- Auto-save form
- Infinite scroll list
- Master-detail view
- Optimistic CRUD
- Multi-step wizard
- Paginated data table
- Async dependent selects
- File upload z progressem
- Live data / polling

**Klocki**
- Debounce
- Async fetcher
- Cleanup / anulowanie
- Retry z backoffem
- Cache + deduplikacja
- useLocalStorage / persystencja
- useEventListener

**Zakresy w aplikacji:** rozpoznawanie (słowa-klucze), wzorce, klocki, kompozycja klocków → wzorce, porównania i pułapki, architektura (container/presentational, lifting state, custom hooks, compound components, reducer).

Zasada: najpierw **słowa-klucze z treści** (dowód), potem **nazwa wzorca** (wniosek).

### 3. Jachtowy Sternik Morski
Przykładowe pytania egzaminacyjne PZŻ z kluczem odpowiedzi — wybór zakresu tematycznego przed startem.

## Demo

https://tomaszlaski.github.io/Study-Quizz/

Deploy: push na `main` → GitHub Actions (Settings → Pages → Source: GitHub Actions).

## Lokalnie

```bash
npm install
npm run dev
```

Aplikacja: `http://127.0.0.1:5173/`

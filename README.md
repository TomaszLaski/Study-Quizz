# React Interview Quiz

A quiz app for practicing React interview questions.

## Credits & license

Question and answer content is derived from
[sudheerj/reactjs-interview-questions](https://github.com/sudheerj/reactjs-interview-questions)
by Sudheer Jonna, used under the MIT License. The full copyright notice and
license text are reproduced in [ATTRIBUTION.md](./ATTRIBUTION.md), as required
by the MIT License.

## Run locally (Git Bash)

```bash
cd /c/Users/Tomasz/react-interview-quiz
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## Update questions from GitHub

```bash
cd /c/Users/Tomasz/react-interview-quiz
rm scripts/README.md
npm run parse
```

## Features

- 400+ questions with answers, tags and difficulty
- Each question has 4 options (A/B/C/D): 1 correct and 3 incorrect
- Practice all questions or a selected category
- Answer checking, key points and full explanation after verification
- Resume where you left off + track passed questions (saved in `localStorage`)
- "Start over" from question 1
- Mark difficult questions (saved in `localStorage`)
- Navigation: previous / next question

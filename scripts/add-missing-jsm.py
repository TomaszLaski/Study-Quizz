"""
Add 13 missing JSM questions that failed PDF parse (mostly figures / column glue).
Then re-apply answer key and renumber ids by sourceNum.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(r"C:\Users\Tomasz\react-interview-quiz")
DATA = ROOT / "src" / "data" / "jsm-questions.json"
KEY = Path(r"C:\Users\Tomasz\Downloads\JSM_klucz_odpowiedzi.md")

# Answers from curated key (preferred over uncertain PDF bottom keys).
MISSING = [
    {
        "sourceNum": 8,
        "category": "Jachty żaglowe morskie",
        "question": (
            "Który z pokazanych obok krętlików najlepiej nadaje się do połączenia "
            "łańcucha z kotwicą? (w oryginale: rysunki A/B/C)"
        ),
        "options": [
            ("A", "Krętlik zwykły / standardowy bez widełek"),
            ("B", "Krętlik z karabińczykiem / hakiem"),
            ("C", "Krętlik z widełkami/szeklą łączący bezpośrednio trzon kotwicy z łańcuchem"),
        ],
        "answer": "C",
        "reason": "Krętlik z widełkami/szeklą — łączy bezpośrednio trzon kotwicy z łańcuchem",
    },
    {
        "sourceNum": 9,
        "category": "Jachty żaglowe morskie",
        "question": (
            "Która z pokazanych kotwic ma największą siłę trzymania? "
            "(w oryginale: rysunki A/B/C)"
        ),
        "options": [
            ("A", "Kotwica admiralicji (patent / stock)"),
            ("B", "Kotwica pługowa / Bruce (największa uniwersalna siła trzymania)"),
            ("C", "Kotwica grzybkowa / rzeczna"),
        ],
        "answer": "B",
        "reason": "Kotwica pługowa/Bruce ma największą uniwersalną siłę trzymania",
    },
    {
        "sourceNum": 17,
        "category": "Jachty żaglowe morskie",
        "question": (
            "Bateria akumulatorów (12 V) o pojemności ok. 200 Ah jest prawie całkowicie "
            "rozładowana. Ile godzin należy prawidłowo ją ładować, jeżeli generator ma "
            "moc ok. 0,48 kW?"
        ),
        "options": [
            ("A", "Ok. 10 godzin prądem 20 A"),
            ("B", "Ok. 10 godzin prądem 10 A"),
            ("C", "Ok. 5 godzin prądem 40 A"),
        ],
        "answer": "C",
        "reason": "0,48 kW / 12 V = 40 A → 200 Ah / 40 A ≈ 5 h",
    },
    {
        "sourceNum": 112,
        "category": "MPZZM (przepisy)",
        "question": (
            "Jacht żaglowy idzie do wejścia do kanału odległego ok. 300 m. Statek "
            "pasażerski wychodzący z kanału na wprost jachtu dał sygnał dźwiękowy "
            "dwa krótkie. Co powinien zrobić jacht?"
        ),
        "options": [
            ("A", "Kontynuować swój kurs"),
            ("B", "Zmienić swój kurs w prawo"),
            ("C", "Zatrzymać się i rzucić kotwicę"),
        ],
        "answer": "B",
        "reason": "Dwa krótkie = „zmieniam kurs w lewo” → jacht odchodzi w prawo",
    },
    {
        "sourceNum": 121,
        "category": "MPZZM (przepisy)",
        "question": (
            "Jacht idący pod żaglami wyprzedzający inny jacht idący pod żaglami:"
        ),
        "options": [
            ("A", "Ma prawo drogi względem jachtu wyprzedzanego"),
            ("B", "Może go ominąć tylko po uzyskaniu jego zgody"),
            ("C", "Ustępuje jachtowi wyprzedzanemu omijając go w bezpiecznej odległości"),
        ],
        "answer": "C",
        "reason": "Wyprzedzający zawsze ustępuje wyprzedzanemu",
    },
    {
        "sourceNum": 156,
        "category": "Nawigacja",
        "question": (
            "Najprostszą metodą pomiaru szybkości jachtu jest „log burtowy”. Jaka będzie "
            "szybkość jachtu, jeżeli długość jachtu wynosi 12 m, a zmierzony czas przy "
            "pomiarze tą metodą wyniósł 6 sekund?"
        ),
        "options": [
            ("A", "2 węzły"),
            ("B", "4 węzły"),
            ("C", "6 węzłów"),
        ],
        "answer": "B",
        "reason": "12 m / 6 s = 2 m/s ≈ 3,9 w ≈ 4 węzły",
    },
    {
        "sourceNum": 170,
        "category": "Nawigacja",
        "question": (
            "Po zakotwiczeniu i naniesieniu pozycji z GPS okazało się, że pozycja na "
            "mapie nie jest prawidłowa (pozycja jachtu na lądzie). Co może być "
            "najprawdopodobniej przyczyną takiej sytuacji?"
        ),
        "options": [
            ("A", "Błędne wskazania GPS"),
            (
                "B",
                "Niezgodność systemu opracowania mapy z systemem GPS i nie uwzględnienie "
                "poprawek podanych na mapie (szczególnie stare wydania map)",
            ),
            ("C", "Uszkodzenie anteny GPS"),
        ],
        "answer": "B",
        "reason": "Niezgodność datum mapy z WGS-84 / brak uwzględnienia poprawek",
    },
    {
        "sourceNum": 178,
        "category": "Nawigacja",
        "question": (
            "Jaki znak ma poprawka na prąd w zależności od kursu jachtu i kierunku prądu?"
        ),
        "options": [
            ("A", "Prąd z lewej burty poprawka „+”, z prawej burty poprawka „−”"),
            ("B", "Prąd z lewej burty poprawka „−”, z prawej burty poprawka „+”"),
            (
                "C",
                "Prąd z lewej burty poprawka „+”, z prawej burty poprawka „−”, ale jeżeli "
                "prąd jest zgodny lub przeciwny do kursu to poprawka „0”",
            ),
        ],
        "answer": "C",
        "reason": "Prąd z lewej „+”, z prawej „−”, zgodny/przeciwny do kursu → 0",
    },
    {
        "sourceNum": 184,
        "category": "Nawigacja",
        "question": (
            "Jacht żegluje kursem kompasowym (Kk). Jak obliczyć kurs rzeczywisty (Kr)?"
        ),
        "options": [
            (
                "A",
                "Znaleźć w tabeli dewiację (dew) dla Kk i obliczyć Kr ze wzoru Kr = Kk + dew",
            ),
            (
                "B",
                "Znaleźć w tabeli dewiację (dew) dla Kk i obliczyć Kr ze wzoru "
                "Kr = Kk + dekl. magn. + dew",
            ),
            (
                "C",
                "Znaleźć w tabeli dewiację (dew) dla Kk i obliczyć Kr ze wzoru "
                "Kr = Kk − dew − dekl. magn.",
            ),
        ],
        "answer": "B",
        "reason": "Kr = Kk + dewiacja + deklinacja",
    },
    {
        "sourceNum": 230,
        "category": "Planowanie rejsów",
        "question": (
            "Sprawdzamy wyposażenie jachtu przed rejsem pełnomorskim. Jacht posiada tylko "
            "latarnię sektorową (trójkolorową) na topie masztu jak na rysunku. Czy jest to "
            "wystarczające wyposażenie do żeglugi pod żaglami?"
        ),
        "options": [
            ("A", "Nie"),
            ("B", "Tak, dla każdej jednostki pod żaglami"),
            ("C", "Tak, ale dla jachtu krótszego od 20 m"),
        ],
        "answer": "C",
        "reason": "Latarnia trójkolorowa na topie — dozwolona dla jachtów < 20 m",
    },
    {
        "sourceNum": 305,
        "category": "Sygnalizacja i łączność",
        "question": (
            "Czy jachty powinny mieć gwizdek (zgodny z wymaganiami MPZZM) do nadawania "
            "sygnałów dźwiękowych?"
        ),
        "options": [
            ("A", "Nie, takie urządzenia muszą mieć tylko większe statki"),
            (
                "B",
                "Tak, wszystkie jachty powinny mieć takie urządzenie odpowiadające "
                "wymaganiom MPZZM",
            ),
            (
                "C",
                "Tak, ale tylko dłuższe od 12 m; krótsze mogą mieć urządzenia nie "
                "odpowiadające normom MPZZM",
            ),
        ],
        "answer": "C",
        "reason": "MPZZM praw. 33: obowiązek dla ≥12 m; krótsze — inne środki sygnalizacji",
    },
    {
        "sourceNum": 323,
        "category": "Sygnalizacja i łączność",
        "question": (
            "Jak należy rozumieć termin: WEZWANIE W NIEBEZPIECZEŃSTWIE I ZAWIADOMIENIE W "
            "NIEBEZPIECZEŃSTWIE?"
        ),
        "options": [
            (
                "A",
                "Wezwanie to tylko podanie nazwy jednostki i sygnału wywoławczego/MMSI, "
                "a zawiadomienie to podanie wszystkich informacji dot. niebezpieczeństwa.",
            ),
            ("B", "Oznacza to samo tylko inaczej sformułowane."),
            (
                "C",
                "Wezwanie dotyczy naszej jednostki, a zawiadomienie dotyczy innej jednostki "
                "w niebezpieczeństwie.",
            ),
        ],
        "answer": "A",
        "reason": "Wezwanie = identyfikacja; zawiadomienie = pełna informacja o niebezpieczeństwie",
    },
    {
        "sourceNum": 327,
        "category": "Sygnalizacja i łączność",
        "question": (
            "Który z sygnałów podanych na rysunkach jest sygnałem wzywania pomocy? "
            "(w oryginale: rysunki A/B/C)"
        ),
        "options": [
            ("A", "Kwadratowa flaga z kulą nad lub pod nią"),
            ("B", "Flaga „K” (żółto-niebieska) — chcę nawiązać łączność"),
            ("C", "Flaga „H” (biało-czerwona) — mam pilota na pokładzie"),
        ],
        "answer": "A",
        "reason": "Kwadratowa flaga z kulą nad lub pod nią",
    },
]


def make_q(item: dict, qid: int) -> dict:
    letter = item["answer"]
    reason = item["reason"]
    options = [
        {"label": lab, "text": text, "correct": lab == letter}
        for lab, text in item["options"]
    ]
    correct_text = next(o["text"] for o in options if o["correct"])
    return {
        "id": qid,
        "sourceNum": item["sourceNum"],
        "category": item["category"],
        "course": "jsm",
        "difficulty": "medium",
        "question": item["question"],
        "shortAnswer": correct_text,
        "answer": f"**Poprawna odpowiedź: {letter}.** {correct_text}\n\n{reason}",
        "keyPoints": [f"Odpowiedź: {letter}", reason],
        "codeExamples": [],
        "tags": ["jsm", item["category"]],
        "relatedQuestions": [],
        "options": options,
        "correctUnknown": False,
    }


def main() -> None:
    questions = json.loads(DATA.read_text(encoding="utf-8"))
    existing = {q["sourceNum"] for q in questions}
    added = []
    for item in MISSING:
        if item["sourceNum"] in existing:
            print(f"skip existing {item['sourceNum']}")
            continue
        added.append(item["sourceNum"])
        questions.append(make_q(item, 0))

    questions.sort(key=lambda q: q["sourceNum"])
    for i, q in enumerate(questions, start=1):
        q["id"] = i

    DATA.write_text(json.dumps(questions, ensure_ascii=False, indent=2), encoding="utf-8")
    nums = {q["sourceNum"] for q in questions}
    missing = [n for n in range(1, 331) if n not in nums]
    print(f"Added: {added}")
    print(f"Total questions: {len(questions)}")
    print(f"Still missing from 1-330: {missing}")
    print(f"correctUnknown: {sum(1 for q in questions if q.get('correctUnknown'))}")


if __name__ == "__main__":
    main()

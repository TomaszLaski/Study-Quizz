"""
Generate React Interview: Wzorce questions.
Full names only (no A1/B2 codes).
keyPoints = short checklist; answer = deeper explanation (not a copy).
"""
from __future__ import annotations

import json
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "src" / "data" / "patterns-questions.json"

PATTERNS = {
    "Debounced async search": {
        "aliases": "typeahead / autocomplete / live search",
        "when": "Wyszukiwarka, picker miasta/uzytkownika, filtr odpytujacy serwer. Input tekstowy steruje zapytaniem sieciowym.",
        "keywords": ["as the user types", "search", "find matching", "autocomplete", "dropdown of results"],
        "blocks": ["Debounce", "Async fetcher", "Cleanup / anulowanie"],
        "differs": "Jesli wpisywanie EDYTUJE dane zamiast szukac -- to Auto-save form, nie Debounced search.",
        "why": "Sterownikiem jest wolny tekst. Bez Debounce zalasz API; bez AbortController dostaniesz race (stara odpowiedz nadpisze nowsza).",
        "pitfalls": [
            "Race condition -- anuluj poprzedni request (AbortController)",
            "Stan idle na starcie -- nie pokazuj 'brak wynikow' zanim user wpisal",
            "Min. dlugosc query (2-3 znaki)",
        ],
    },
    "Auto-save form": {
        "aliases": "save-as-you-type / settings panel",
        "when": "Edycja profilu, panel ustawien, toggle preferencji. Zmiana danych + zapis na serwer + status, BEZ przycisku submit.",
        "keywords": ["auto-save", "save after the user stops typing", "Saved confirmation", "Saving indicator"],
        "blocks": ["Debounce", "Async fetcher", "Cleanup / anulowanie", "useEventListener"],
        "differs": "Auto-save CZEKA na serwer i pokazuje 'Saved'. Optimistic CRUD pokazuje zmiane OD RAZU.",
        "why": "User nie klika Submit -- UI musi komunikowac stan zapisu (Saving / Saved / Error) i chronić przed wyjsciem w trakcie zapisu (beforeunload).",
        "pitfalls": [
            "Race -- ostatni zapis musi wygrac",
            "PATCH vs PUT -- wysylaj zmienione pola",
            "beforeunload odpinaj w cleanup",
            "Walidacja przed wyslaniem",
        ],
    },
    "Infinite scroll list": {
        "aliases": "load-more / paginated feed",
        "when": "Feed artykulow, lista produktow, duze wyniki. Kolejne porcje przy scrollu -- dane sie AKUMULUJA.",
        "keywords": ["infinite scroll", "load more", "scrolls to the bottom", "next batch"],
        "blocks": ["Async fetcher", "Cleanup / anulowanie", "useEventListener", "Retry z backoffem"],
        "differs": "Paginated data table: strony ZASTEPUJA sie i zyja w URL; tu porcje sie AKUMULUJA.",
        "why": "UX 'nieskonczonej listy' wymaga straznika loading (bez podwojnego fetchu), akumulacji stanu i sygnału 'koniec danych'.",
        "pitfalls": [
            "Blokuj fetch gdy loading trwa",
            "setItems(prev => [...prev, ...new])",
            "Rozpoznaj koniec stron z API",
        ],
    },
    "Master-detail view": {
        "aliases": "list + detail / split view",
        "when": "Skrzynka mailowa, lista zamowien z detalem, panel admina. Lista + osobny widok elementu.",
        "keywords": ["select an item", "show details", "list and detail", "side panel"],
        "blocks": ["Async fetcher", "Cleanup / anulowanie"],
        "differs": "Detal w modalu zamiast panelu -- to NADAL Master-detail.",
        "why": "selectedId musi zyc w wspolnym przodku (lifting state up). Szybkie klikniecia wymagaja abort poprzedniego fetchu detalu.",
        "pitfalls": [
            "Abort przy szybkim przeklikiwaniu",
            "Placeholder gdy nic nie wybrano",
            "selectedId w rodzicu, nie w liscie",
        ],
    },
    "Optimistic CRUD": {
        "aliases": "instant-feedback add/edit/delete",
        "when": "Lista todo, koszyk, tagi. Operacje na zbiorze + natychmiastowa reakcja UI.",
        "keywords": ["add / edit / delete", "feel instant", "optimistic", "update the list immediately"],
        "blocks": ["Async fetcher", "Cleanup / anulowanie"],
        "differs": "Bez 'instant/optimistic' + obecnosc 'Saved' -- to Auto-save form.",
        "why": "Zmieniasz UI przed odpowiedzią serwera. Dlatego musisz trzymac snapshot do rollbacku i radzic sobie z tymczasowymi id.",
        "pitfalls": [
            "Rollback przy bledzie mutacji",
            "Tymczasowe id przed id z serwera",
            "Spojnosc przy rownoczesnych mutacjach",
        ],
    },
    "Multi-step wizard": {
        "aliases": "checkout / onboarding / formularz krokowy",
        "when": "Checkout, onboarding, konfigurator, wniosek wieloetapowy. Kroki + jeden zapis na koncu.",
        "keywords": ["steps", "next / back", "step 2 of 4", "progress indicator", "review before submit"],
        "blocks": ["useLocalStorage / persystencja"],
        "differs": "Jeden submit na koncu. 'Saved po kazdym kroku' = hybryda z Auto-save form.",
        "why": "Kroki sie odmontowuja -- stan musi zyc w orchestratorze. Next waliduje biezacy krok; Submit waliduje calosc.",
        "pitfalls": [
            "Stan w orchestratorze nad krokami",
            "Walidacja per krok vs calosc",
            "Back nie czysci wczesniejszych danych",
        ],
    },
    "Paginated data table": {
        "aliases": "sort + filtr + strony z przyciskami",
        "when": "Panel admina, zamowienia, raporty. Strony zastepuja sie; stan tabeli w URL.",
        "keywords": ["sortable columns", "filter", "page 2 of N", "previous / next page", "rows per page"],
        "blocks": ["Debounce", "Async fetcher", "Cleanup / anulowanie", "Cache + deduplikacja", "useLocalStorage / persystencja"],
        "differs": "Infinite scroll AKUMULUJE; tu NADPISUJE. Samo 'page' nie przesadza.",
        "why": "URL jest zrodlem prawdy (back + share). Zmiana filtra resetuje page=1; filtr tekstowy idzie przez Debounce.",
        "pitfalls": [
            "URL jako source of truth",
            "Zmiana filtra -> page=1",
            "Sort/filtr po stronie serwera",
            "Debounce na filtr tekstowy",
        ],
    },
    "Async dependent selects": {
        "aliases": "kaskadowe selecty / cascading dropdowns",
        "when": "Adres, kategoria->podkategoria, marka->model. Fetch opcji po WYBORZE, nie po wpisywaniu.",
        "keywords": ["depends on", "based on selection", "cascading", "when the user picks X, load Y"],
        "blocks": ["Async fetcher", "Cleanup / anulowanie"],
        "differs": "Debounced search: sterownik = TEKST + cisza. Tu sterownik = KLIK -- Debounce zbedny.",
        "why": "Zmiana rodzica musi resetowac dzieci (inaczej bug danych). Kazdy poziom ma wlasny loading i abort.",
        "pitfalls": [
            "Reset dzieci po zmianie rodzica",
            "Abort przy szybkim klikaniu",
            "Disabled dopoki rodzic niewybrany",
            "Loading per poziom",
        ],
    },
    "File upload z progressem": {
        "aliases": "upload / drag&drop / cancel",
        "when": "Awatar, zalaczniki, import CSV. Dluga wysylka + pasek postepu + cancel.",
        "keywords": ["upload", "progress bar", "cancel upload", "drag and drop", "multiple files"],
        "blocks": ["Cleanup / anulowanie", "Retry z backoffem"],
        "differs": "fetch() nie daje postepu -- potrzebny XHR + upload.onprogress i stan progress 0-100.",
        "why": "Stan per plik (mapa id->stan). Cancel = xhr.abort() + cleanup. Waliduj typ/rozmiar PRZED wysylka.",
        "pitfalls": [
            "XHR zamiast fetch dla progress",
            "Stan per plik",
            "xhr.abort() przy cancel",
            "Walidacja przed uploadem",
        ],
    },
    "Live data / polling": {
        "aliases": "dashboard / refresh every X / live",
        "when": "Dashboard metryk, kursy, status joba, powiadomienia. Swiezosc danych jako wymog.",
        "keywords": ["real-time", "refresh every", "live updates", "when the tab becomes active"],
        "blocks": ["Async fetcher", "Cleanup / anulowanie", "useEventListener", "Retry z backoffem"],
        "differs": "Infinite scroll dokleja; polling ZASTEPUJE wynik. Instant po kliku usera = Optimistic CRUD.",
        "why": "Pauzuj przy document.hidden. Unikaj nakladajacych sie requestow (pomin tick gdy loading). Callback intervalu w useRef.",
        "pitfalls": [
            "useRef na callback intervalu",
            "Pauza gdy document.hidden",
            "Pomin tick gdy loading",
            "Abort poprzedniego fetchu",
        ],
    },
}

BLOCKS = {
    "Debounce": {
        "does": "Opoznia akcje az minie X ms ciszy. Kazda nowa zmiana resetuje timer.",
        "when": "Search-as-you-type, auto-save, resize -- 'po ostatniej zmianie, nie po kazdej'.",
        "used_in": ["Debounced async search", "Auto-save form", "Paginated data table (filtr)"],
        "explain": "Pod spodem: setTimeout + clearTimeout w cleanup efektu. To nie throttle -- throttle przepuszcza co X ms nawet bez ciszy.",
        "pitfalls": [
            "Cleanup timera w return useEffect",
            "ReturnType<typeof setTimeout>",
            "Nie mylic z throttle",
        ],
    },
    "Async fetcher": {
        "does": "Pobiera dane i modeluje stany: idle / loading / success / error / empty.",
        "when": "Kazde pobieranie z API -- najczestszy klocek.",
        "used_in": ["prawie wszystkie wzorce-komponenty"],
        "explain": "Discriminated union eliminuje nielegalne kombinacje (loading+error). fetch nie rzuca na 4xx/5xx -- sprawdz res.ok. empty != error != idle.",
        "pitfalls": [
            "Sprawdzaj res.ok",
            "empty != error",
            "idle != empty",
        ],
    },
    "Cleanup / anulowanie": {
        "does": "Zatrzymuje timer/fetch/listener przy unmount lub zmianie zaleznosci.",
        "when": "Zawsze gdy efekt startuje cos dluzej niz render -- obowiazek, nie opcja.",
        "used_in": ["prawie wszystkie wzorce-komponenty"],
        "explain": "Dla fetch: AbortController.abort() w cleanup. AbortError w catch ignorujesz -- to intencja. StrictMode montuje 2x w devie.",
        "pitfalls": [
            "AbortError to nie blad UI",
            "Ta sama referencja add/remove",
            "Poprawny cleanup pod StrictMode",
        ],
    },
    "Retry z backoffem": {
        "does": "Ponawia nieudane zadanie z limitem prob i rosnacym odstepem.",
        "when": "Infinite scroll, upload, polling -- gdy porazka bywa chwilowa i operacja jest bezpieczna do ponowienia.",
        "used_in": ["Infinite scroll list", "File upload z progressem", "Live data / polling"],
        "explain": "Nie retry'uj 4xx ani AbortError. Limit prob obowiazkowy. Jitter chroni przed thundering herd.",
        "pitfalls": [
            "Bez retry na 4xx i AbortError",
            "Twardy limit prob",
            "Jitter przy backoffie",
        ],
    },
    "Cache + deduplikacja": {
        "does": "Ten sam klucz = jeden fetch. Inflight wspoldzielony, wynik zapamietany.",
        "when": "Dwa komponenty o to samo; powrot do strony tabeli; powtorzone query.",
        "used_in": ["Debounced async search", "Paginated data table"],
        "explain": "Kolejnosc: cache -> inflight -> nowy fetch. Klucz = endpoint + parametry. Po mutacji inwaliduj. Nie cache'uj bledow.",
        "pitfalls": [
            "Klucz = endpoint + parametry",
            "Inwalidacja po mutacji",
            "inflight czysc w finally",
            "Nie cache'uj bledow",
        ],
    },
    "useLocalStorage / persystencja": {
        "does": "Stan Reacta w localStorage -- przezywa refresh, sync miedzy kartami.",
        "when": "Szkic wizarda, preferencje tabeli, motyw. NIE dla sekretow.",
        "used_in": ["Multi-step wizard", "Paginated data table"],
        "explain": "Czytaj w lazy initializerze useState (raz). JSON.parse w try/catch. storage event tylko z INNYCH kart. Guard SSR.",
        "pitfalls": [
            "Lazy initializer, nie body render",
            "try/catch na JSON.parse",
            "storage event tylko inne karty",
            "NIE trzymaj sekretow",
        ],
    },
    "useEventListener": {
        "does": "addEventListener z cleanupem i swiezym handlerem przez useRef.",
        "when": "Scroll, resize, keydown, beforeunload, visibilitychange, click-outside.",
        "used_in": ["Auto-save form", "Infinite scroll list", "Live data / polling"],
        "explain": "Handler w useRef = bez remove+add co render. Ta sama referencja do add i remove. passive:true dla scroll gdy bez preventDefault.",
        "pitfalls": [
            "Ta sama referencja add/remove",
            "Handler w useRef",
            "passive: true gdy mozliwe",
        ],
    },
}


def opts(correct: str, wrong1: str, wrong2: str, seed: int = 0) -> list[dict]:
    texts = [correct, wrong1, wrong2]
    correct_idx = seed % 3
    ordered: list[tuple[str, bool] | None] = [None, None, None]
    ordered[correct_idx] = (texts[0], True)
    others = [texts[1], texts[2]]
    oi = 0
    for i in range(3):
        if ordered[i] is None:
            ordered[i] = (others[oi], False)
            oi += 1
    return [
        {"label": label, "text": text, "correct": is_c}
        for label, (text, is_c) in zip(("A", "B", "C"), ordered)
    ]


_seed = 0


def next_opts(correct: str, wrong1: str, wrong2: str) -> list[dict]:
    global _seed
    _seed += 1
    return opts(correct, wrong1, wrong2, seed=_seed)


def make_q(
    *,
    category: str,
    difficulty: str,
    question: str,
    answer: str,
    key_points: list[str],
    options: list[dict],
    tags: list[str],
) -> dict:
    correct = next(o["text"] for o in options if o["correct"])
    return {
        "category": category,
        "difficulty": difficulty,
        "question": question,
        "shortAnswer": correct,
        "answer": answer,
        "keyPoints": key_points,
        "codeExamples": [],
        "tags": tags,
        "relatedQuestions": [],
        "options": options,
        "course": "patterns",
        "correctUnknown": False,
    }


questions: list[dict] = []
pattern_names = list(PATTERNS.keys())
block_names = list(BLOCKS.keys())

# 1) Rozpoznawanie: scenariusz -> wzorzec
SCENARIOS = [
    (
        "Zadanie: 'Build a search box that fetches matching users as the user types and shows an autocomplete dropdown.'\n\nKtory wzorzec stosujesz?",
        "Debounced async search",
        "Auto-save form",
        "Async dependent selects",
    ),
    (
        "Zadanie: 'Profile settings should auto-save after the user stops typing and show a Saved confirmation.'\n\nKtory wzorzec stosujesz?",
        "Auto-save form",
        "Optimistic CRUD",
        "Debounced async search",
    ),
    (
        "Zadanie: 'Product feed that loads the next batch when the user scrolls to the bottom.'\n\nKtory wzorzec stosujesz?",
        "Infinite scroll list",
        "Paginated data table",
        "Live data / polling",
    ),
    (
        "Zadanie: 'Inbox: click a message in the list to show its details in a side panel.'\n\nKtory wzorzec stosujesz?",
        "Master-detail view",
        "Optimistic CRUD",
        "Multi-step wizard",
    ),
    (
        "Zadanie: 'Todo list where add/edit/delete should feel instant (optimistic), with rollback on failure.'\n\nKtory wzorzec stosujesz?",
        "Optimistic CRUD",
        "Auto-save form",
        "Infinite scroll list",
    ),
    (
        "Zadanie: 'Checkout with steps, next/back, progress indicator, and review before a single submit.'\n\nKtory wzorzec stosujesz?",
        "Multi-step wizard",
        "Auto-save form",
        "Paginated data table",
    ),
    (
        "Zadanie: 'Admin orders table with sortable columns, text filter, page 2 of N buttons; URL should be shareable.'\n\nKtory wzorzec stosujesz?",
        "Paginated data table",
        "Infinite scroll list",
        "Master-detail view",
    ),
    (
        "Zadanie: 'Address form: when the user picks a country, load cities; picking a city loads districts.'\n\nKtory wzorzec stosujesz?",
        "Async dependent selects",
        "Debounced async search",
        "Master-detail view",
    ),
    (
        "Zadanie: 'Avatar upload with progress bar, cancel mid-upload, and drag-and-drop.'\n\nKtory wzorzec stosujesz?",
        "File upload z progressem",
        "Auto-save form",
        "Optimistic CRUD",
    ),
    (
        "Zadanie: 'Metrics dashboard that refreshes every 5s and pauses when the tab becomes hidden.'\n\nKtory wzorzec stosujesz?",
        "Live data / polling",
        "Optimistic CRUD",
        "Infinite scroll list",
    ),
]

for scenario, correct, w1, w2 in SCENARIOS:
    p = PATTERNS[correct]
    questions.append(
        make_q(
            category="Rozpoznawanie (kiedy uzywac)",
            difficulty="medium",
            question=scenario,
            key_points=[
                f"Wzorzec: {correct}",
                f"Slowa-klucze: {', '.join(p['keywords'][:3])}",
                p["differs"],
            ],
            answer=(
                f"**Jak dojsc do odpowiedzi na rozmowie**\n\n"
                f"1. Wypisz z tresci zadania slowa-klucze (dowod).\n"
                f"2. Dopiero potem nazwij wzorzec (wniosek) -- nigdy odwrotnie.\n\n"
                f"Tu klucze to: {', '.join(p['keywords'])}.\n\n"
                f"**Dlaczego {correct}?** {p['why']}\n\n"
                f"**Kiedy stosujesz:** {p['when']}\n\n"
                f"**Klocki:** {', '.join(p['blocks'])}."
            ),
            options=next_opts(correct, w1, w2),
            tags=["rozpoznawanie", "kiedy"],
        )
    )

# 2) Kiedy stosowac -- bezposrednio
for i, name in enumerate(pattern_names):
    p = PATTERNS[name]
    w1 = PATTERNS[pattern_names[(i + 1) % len(pattern_names)]]["when"]
    w2 = PATTERNS[pattern_names[(i + 2) % len(pattern_names)]]["when"]
    band = "Wzorce -- wyszukiwanie i dane" if i < 5 else "Wzorce -- formularze i zaawansowane"
    questions.append(
        make_q(
            category=band,
            difficulty="easy",
            question=f"Kiedy stosowac wzorzec '{name}'?",
            key_points=[
                p["when"],
                f"Alias: {p['aliases']}",
                f"Nie myl: {p['differs']}",
            ],
            answer=(
                f"**{name}** ({p['aliases']})\n\n"
                f"{p['why']}\n\n"
                f"**Sygnaly w tresci zadania:** {', '.join(p['keywords'])}.\n\n"
                f"**Z czego skladasz:** {', '.join(p['blocks'])}.\n\n"
                f"**Typowe pomyłki:** {p['differs']}"
            ),
            options=next_opts(p["when"], w1, w2),
            tags=["kiedy", "stosowanie"],
        )
    )

# 3) Porownania
DIFFS = [
    (
        "User edytuje email w ustawieniach; po ciszy wysylany jest PATCH i pojawia sie 'Saved'. Ktory wzorzec?",
        "Auto-save form -- czeka na serwer i pokazuje potwierdzenie 'Saved'",
        "Optimistic CRUD -- zmiana widoczna od razu, bez czekania na 'Saved'",
        "Debounced async search -- bo jest debounce przed wyslaniem",
        [
            "Slowo 'Saved confirmation' = Auto-save form",
            "Optimistic nie czeka na 'Saved' -- zmienia UI od razu",
            "Debounce sam w sobie nie decyduje o wzorcu",
        ],
        "Na rozmowie oddziel 'cisze przed zapisem' od 'instant UI'. Cisza + Saved = Auto-save (Debounce + status zapisu). Instant bez Saved = Optimistic CRUD. Debounce moze byc w obu -- nie jest wystarczajacym dowodem.",
    ),
    (
        "Feed laduje kolejne posty przy scrollu (dane sie doklejaja). Tabela admina ma przyciski 'strona 2 z N' i stan w URL. Ktore wzorce?",
        "Scroll + akumulacja = Infinite scroll list; przyciski + URL = Paginated data table",
        "Oba to Infinite scroll list, bo jest slowo 'page'",
        "Oba to Paginated data table, bo jest paginacja",
        [
            "Akumulacja przy scrollu = Infinite scroll list",
            "Przyciski stron + URL = Paginated data table",
            "Samo 'page' nie przesadza",
        ],
        "Pytaj: czy dane sie doklejaja, czy strona zastępuje poprzednia? Czy stan ma byc share'owalny w URL? To dwa rozne kontrakty UI i stanu -- nie wystarczy uslyszec 'paginacja'.",
    ),
    (
        "Select kraju laduje liste miast po kliknieciu. Search box laduje wyniki podczas wpisywania. Ktore wzorce?",
        "Klik wyboru -> Async dependent selects; wpisywanie -> Debounced async search",
        "Oba to Debounced async search, bo jest fetch danych",
        "Oba to Async dependent selects, bo jest zaleznosc miedzy polami",
        [
            "Wyzwalacz = klik/wybor -> Async dependent selects",
            "Wyzwalacz = tekst + cisza -> Debounced async search",
            "Sam fakt fetchu nic nie rozstrzyga",
        ],
        "Roznica jest w sterowniku: dyskretny wybor vs ciagly tekst. Przy tekscie potrzebujesz Debounce i abort race. Przy kliku Debounce zwykle zbedny, ale reset dzieci i abort przy szybkim klikaniu -- tak.",
    ),
    (
        "Zadanie: 'instant update of the list' przy delete. Ktos proponuje formularz z auto-save i statusem Saved. Co jest nie tak?",
        "To Optimistic CRUD -- 'instant' oznacza pokazanie zmiany przed odpowiedzia serwera, nie czekanie na Saved",
        "Auto-save form jest OK, bo tez zapisuje na serwer",
        "To Live data / polling, bo lista ma byc swieza",
        [
            "'instant/optimistic' => Optimistic CRUD",
            "'Saved' bez instant => Auto-save form",
            "Polling to swiezosc BEZ akcji usera",
        ],
        "Auto-save i Optimistic oba mowia z serwerem, ale kontrakt UX jest przeciwny: czekasz na potwierdzenie vs kłamiesz UI i robisz rollback. 'Instant' w tresci jest twardym dowodem na Optimistic.",
    ),
    (
        "'Refresh every 5 seconds' vs 'update the UI instantly after user clicks delete'. Ktore wzorce?",
        "Odswiezanie co 5 sekund -> Live data / polling; instant po kliku -> Optimistic CRUD",
        "Oba to Live data / polling, bo dane sie odswiezaja",
        "Oba to Optimistic CRUD, bo UI reaguje szybko",
        [
            "Interwal bez akcji usera = Live data / polling",
            "Natychmiast po akcji usera = Optimistic CRUD",
            "Szybkie UI != polling",
        ],
        "Polling odpowiada na wymog swiezosci danych w czasie. Optimistic odpowiada na wymog poczucia responsywnosci po mutacji. Moga wspolistniec w jednym ekranie, ale to dwa rozne problemy.",
    ),
    (
        "Checkout ma 4 kroki i jedno klikniecie 'Kup' na koncu. Formularz profilu zapisuje zmiany po kazdym kroku bez przycisku. Ktore wzorce?",
        "Checkout jednorazowy submit -> Multi-step wizard; formularz z zapisem co krok -> hybryda Multi-step wizard + Auto-save form",
        "Oba to Multi-step wizard, bo sa kroki",
        "Oba to Auto-save form, bo zapis jest automatyczny",
        [
            "Jeden submit na koncu = czysty Multi-step wizard",
            "Zapis po kroku = dokladasz Auto-save form",
            "Same 'kroki' nie wystarcza",
        ],
        "Wizard odpowiada za orchestracje krokow i stan. Auto-save odpowiada za zapis w tle. Jesli w tresci jest 'Saved after each step', masz hybryde -- nie wybieraj tylko jednego z przyzwyczajenia.",
    ),
]

for question, c, w1, w2, kps, expl in DIFFS:
    questions.append(
        make_q(
            category="Porownania i pulapki",
            difficulty="hard",
            question=question,
            key_points=kps,
            answer=f"**Werdykt:** {c}\n\n**Jak myslec:** {expl}",
            options=next_opts(c, w1, w2),
            tags=["porownanie", "pulapka"],
        )
    )

# 4) Pulapki per wzorzec
PITFALL_QS = [
    (
        "Debounced async search",
        "Race condition przy typeaheadzie -- odpowiedz dla 'war' wraca po odpowiedzi dla 'warsz'. Co robic?",
        "Anulowac poprzedni request przy kazdej nowej wartosci (AbortController + Cleanup / anulowanie)",
        "Zwiekszyc debounce do 5 sekund",
        "Pokazac wszystkie odpowiedzi naraz i wybrac ostatnia",
    ),
    (
        "Infinite scroll list",
        "Jak aktualizowac liste po dociagnieciu kolejnej strony w Infinite scroll?",
        "Akumulacja: setItems(prev => [...prev, ...new]) -- nowa strona doklejana do poprzednich",
        "Nadpisanie: setItems(new) -- lista zastepowana co strone",
        "Zapis tylko do URL bez lokalnego stanu",
    ),
    (
        "Paginated data table",
        "Co powinno byc zrodlem prawdy dla page/sort/filter w Paginated data table?",
        "URL (URLSearchParams) -- back button i share linkiem dzialaja poprawnie",
        "Wylacznie useState w kontenerze tabeli",
        "localStorage bez odzwierciedlenia w URL",
    ),
    (
        "Paginated data table",
        "User zmienia filtr tekstowy bedac na stronie 7 wynikow. Co zrobic z numerem strony?",
        "Zresetowac page do 1 -- inaczej user laduje na pustej stronie 7",
        "Zostawic page=7 bez zmian",
        "Przejsc automatycznie na ostatnia dostepna strone",
    ),
    (
        "Async dependent selects",
        "User zmienia kraj w kaskadowym select. Co powinno stac sie z polem 'miasto' i 'dzielnica'?",
        "Zresetowac wartosci dzieci -- miasto z poprzedniego kraju to bug danych",
        "Zostawic poprzednie wartosci dla wygody usera",
        "Wyslac poprzedni cityId do API i poczekac na blad",
    ),
    (
        "File upload z progressem",
        "Dlaczego sam fetch() nie wystarczy do wyswietlenia paska postepu uploadu?",
        "fetch nie eksponuje postepu wysylania -- potrzebny XMLHttpRequest z upload.onprogress",
        "fetch zawsze blokuje glowny watek UI",
        "fetch nie obsluguje FormData z plikami binarnymi",
    ),
    (
        "Live data / polling",
        "Polling bije w API gdy karta przegladarki jest w tle. Jak prawidlowo to obsluzyc?",
        "Pauzowac gdy document.hidden; odswiezac natychmiast po powrocie karty (visibilitychange)",
        "Skrocic interwal do 100 ms by nadrobiac zaleglosci",
        "Uzyc tylko setTimeout bez cleanup w efekcie",
    ),
    (
        "Multi-step wizard",
        "Gdzie powinien mieszkac stan danych wszystkich krokow wizarda?",
        "W orchestratorze / kontenerze nad krokami -- odmontowany krok traci swoj lokalny stan",
        "Lokalnie w kazdym kroku osobno -- odpowiedzialnosc kazdego komponentu",
        "Tylko w URL bez React state",
    ),
    (
        "Optimistic CRUD",
        "Optimistic delete sie nie udal na serwerze -- serwer zwrocil blad. Co dalej?",
        "Rollback -- przywroc poprzedni stan listy zachowany przed mutacja",
        "Zostawic element usuniety w UI -- serwer to mniej wazny",
        "Odswiezac cala strone (window.location.reload)",
    ),
    (
        "Master-detail view",
        "Gdzie trzymac selectedId (id wybranego elementu listy) w Master-detail view?",
        "W rodzicu (lifting state up) -- najnizszy wspolny przodek listy i panelu detalu",
        "Wylacznie wewnatrz komponentu listy",
        "Wylacznie w panelu detalu",
    ),
]

for pattern_name, question, c, w1, w2 in PITFALL_QS:
    p = PATTERNS[pattern_name]
    i = pattern_names.index(pattern_name)
    band = "Wzorce -- wyszukiwanie i dane" if i < 5 else "Wzorce -- formularze i zaawansowane"
    questions.append(
        make_q(
            category=band,
            difficulty="medium",
            question=question,
            key_points=[c, *p["pitfalls"][:2]],
            answer=(
                f"**Poprawne zachowanie:** {c}\n\n"
                f"**Kontekst wzorca '{pattern_name}':** {p['why']}\n\n"
                f"**Inne typowe pulapki tego wzorca:**\n"
                + "\n".join(f"- {pt}" for pt in p["pitfalls"])
            ),
            options=next_opts(c, w1, w2),
            tags=["pulapka"],
        )
    )

# 5) Klocki -- kiedy
for i, bname in enumerate(block_names):
    b = BLOCKS[bname]
    w1 = BLOCKS[block_names[(i + 1) % len(block_names)]]["when"]
    w2 = BLOCKS[block_names[(i + 2) % len(block_names)]]["when"]
    band = "Klocki -- podstawa" if i < 3 else "Klocki -- zaawansowane"
    questions.append(
        make_q(
            category=band,
            difficulty="easy",
            question=f"Kiedy uzywasz klocka '{bname}'?",
            key_points=[b["when"], b["does"], f"Widzisz m.in. w: {', '.join(b['used_in'][:2])}"],
            answer=(
                f"**{bname}**\n\n"
                f"{b['explain']}\n\n"
                f"**Po co w praktyce:** {b['when']}\n\n"
                f"**Uzywany w:** {', '.join(b['used_in'])}."
            ),
            options=next_opts(b["when"], w1, w2),
            tags=["klocek", "kiedy"],
        )
    )

# 6) Kompozycja
COMPOSITIONS = [
    (
        "Debounced async search",
        "Debounce + Async fetcher + Cleanup / anulowanie (+ Cache + deduplikacja dla powtorzonego query)",
        "useLocalStorage / persystencja + useEventListener",
        "Tylko Retry z backoffem",
        "Debounce limituje requesty, Async fetcher trzyma stany UI, Cleanup abortuje race. Cache dokladasz gdy to samo query wraca.",
    ),
    (
        "Auto-save form",
        "Debounce + Async fetcher + Cleanup / anulowanie + useEventListener (beforeunload)",
        "Cache + deduplikacja + useLocalStorage / persystencja",
        "Tylko Debounce",
        "Debounce czeka na cisze, fetcher zapisuje i pokazuje status, cleanup chroni przed race, useEventListener pilnuje beforeunload.",
    ),
    (
        "Infinite scroll list",
        "Async fetcher + Cleanup / anulowanie + useEventListener (intersection) + Retry z backoffem",
        "Debounce + useLocalStorage / persystencja",
        "Cache + deduplikacja + useLocalStorage / persystencja",
        "Intersection/scroll odpala kolejna strone, fetcher akumuluje, cleanup/abort i retry pilnuja niestabilnej sieci.",
    ),
    (
        "Paginated data table",
        "Debounce (filtr) + Async fetcher + Cleanup / anulowanie + Cache + deduplikacja + useLocalStorage / persystencja",
        "Tylko Async fetcher",
        "useEventListener + Retry z backoffem",
        "Filtr tekstowy idzie przez Debounce, stan stron cache'ujesz, URL/persystencja trzymaja preferencje. Sam fetcher nie wystarczy.",
    ),
    (
        "File upload z progressem",
        "Cleanup / anulowanie (abort XHR) + Retry z backoffem",
        "Debounce + Cache + deduplikacja",
        "useLocalStorage / persystencja + Async fetcher bez progress",
        "Tu rdzeniem jest XHR z progress + mozliwosc abort i rozsądny retry. Klasyczny fetch/async fetcher bez progress nie spelnia UX.",
    ),
    (
        "Live data / polling",
        "Async fetcher + Cleanup / anulowanie + useEventListener (visibilitychange) + Retry z backoffem",
        "Debounce + useLocalStorage / persystencja",
        "Tylko Cache + deduplikacja",
        "Fetcher odswieza dane, visibilitychange pauzuje w tle, cleanup/abort i retry chronia przed nakladaniem i chwilowymi bledami.",
    ),
]

for pattern_name, c, w1, w2, why in COMPOSITIONS:
    questions.append(
        make_q(
            category="Klocki -> wzorce",
            difficulty="medium",
            question=f"Z jakich klockow skladasz wzorzec '{pattern_name}'?",
            key_points=[c, f"Kazdy feature to zwykle 3-5 klockow"],
            answer=(
                f"**Sklad:** {c}\n\n"
                f"**Dlaczego wlasnie te:** {why}\n\n"
                f"Na rozmowie nie wymieniaj kodow -- mow nazwami klockow i rolami, jakie pelnia w tym UX."
            ),
            options=next_opts(c, w1, w2),
            tags=["kompozycja", "klocki"],
        )
    )

# 7) Mechanizm klockow
MECH = [
    (
        "Debounce",
        "Jak dziala Debounce pod spodem? Opisz mechanizm.",
        "setTimeout ustawia wartosc/akcje na pozniej; clearTimeout w cleanup efektu kasuje poprzedni timer przy kazdej nowej zmianie",
        "throttle: przepuszcza jedno zdarzenie co X ms niezaleznie od ciszy miedzy zdarzeniami",
        "requestAnimationFrame bez zadnego cleanup",
    ),
    (
        "Async fetcher",
        "Dlaczego stany fetchu modelowac jako discriminated union (idle | loading | success | error | empty), a nie osobne booleany?",
        "Eliminuje nielegalne kombinacje stanow (np. loading + error naraz) i wymusza obsluge kazdego stanu w UI",
        "TypeScript wymaga zawsze 5 pol w obiekcie stanu",
        "Zeby moc uniknac uzywania useEffect",
    ),
    (
        "Cleanup / anulowanie",
        "User szybko zmienia query w search. Co robi AbortController w cleanup useEffect?",
        "Wywoluje abort() na poprzednim fetchu; AbortError w catch ignorujesz -- to intencja, nie blad",
        "Ponawia stary fetch w tle z nizszym priorytetem",
        "Zapisuje oba wyniki do cache bez klucza i wybiera pozniejszy",
    ),
    (
        "Retry z backoffem",
        "Dla jakich statusow HTTP i bledow NIE powinienes robic retry?",
        "4xx (blad klienta -- retry nic nie da) oraz AbortError (to intencja anulowania, nie awaria)",
        "Tylko dla statusu 200 OK",
        "Dla wszystkich 5xx bez zadnego limitu prob",
    ),
    (
        "Cache + deduplikacja",
        "Jaka jest kolejnosc sprawdzania w fetchOnce (cache + dedup)?",
        "Najpierw cache -> potem inflight (dolacz do trwajacego Promise) -> dopiero nowy fetch",
        "Zawsze nowy fetch, wynik zapisz do cache",
        "Tylko localStorage -- bez trzymania Promise w pamieci",
    ),
    (
        "useLocalStorage / persystencja",
        "Dlaczego czytac localStorage w lazy initializerze useState (funkcja), a nie w ciele komponentu?",
        "Lazy initializer wykonuje sie RAZ na mount; czytanie w ciele komponentu powtarza sie co render",
        "Bo localStorage dziala wylacznie wewnatrz useEffect",
        "Bo SSR wymaga czytania co render na serwerze",
    ),
    (
        "useEventListener",
        "Po co trzymac handler w useRef zamiast przekazywac go bezposrednio do addEventListener?",
        "Subskrypcja widzi zawsze swiezy callback bez kosztownego remove+add przy kazdym renderze",
        "Zeby ominac TypeScript i miec typ any",
        "Bo addEventListener wymaga ref DOM, nie funkcji",
    ),
]

for bname, question, c, w1, w2 in MECH:
    b = BLOCKS[bname]
    bi = block_names.index(bname)
    band = "Klocki -- podstawa" if bi < 3 else "Klocki -- zaawansowane"
    questions.append(
        make_q(
            category=band,
            difficulty="hard",
            question=question,
            key_points=[c, *b["pitfalls"][:2]],
            answer=(
                f"**Mechanizm:** {c}\n\n"
                f"**Szerszy kontekst:** {b['explain']}\n\n"
                f"**Pilnuj tez:**\n" + "\n".join(f"- {pt}" for pt in b["pitfalls"])
            ),
            options=next_opts(c, w1, w2),
            tags=["mechanizm"],
        )
    )

# 8) Architektura
ARCH_QS = [
    (
        "Co oznacza wzorzec Container / presentational w React?",
        "Logika i stan w kontenerze, render w glupich komponentach bez wlasnego stanu. Testowalnosc renderu bez mockow sieci, reuzycje prezentacji z inna logika.",
        "Wszystkie komponenty musza miec wlasny fetch",
        "Zakaz uzywania hookow",
        [
            "Kontener = stan + efekty + dane",
            "Presentational = props in, UI out",
            "Latwiejsze testy i reuzycie UI",
        ],
        "To nie zakaz hookow -- to podzial odpowiedzialnosci. Mozesz miec smart hooka w kontenerze i czysty komponent listy/detalu karmiony propsami.",
    ),
    (
        "Gdzie powinien mieszkac selectedId w Master-detail view? Jaka zasada to reguluje?",
        "W najnizszym wspolnym przodku listy i panelu detalu -- zasada Lifting state up",
        "Zawsze w globalnym Redux store",
        "Tylko w localStorage",
        [
            "Lifting state up = najnizszy wspolny przodek",
            "Lista i detal wspoldziela selectedId",
            "Globalny store nie jest domyslny",
        ],
        "Redux/localStorage wchodza dopiero gdy ten sam wybor jest potrzebny daleko w drzewie albo ma przezyc refresh. Na start: lokalny stan rodzica.",
    ),
    (
        "Kiedy ekstrahowac logike do custom hooka (np. useSearch, useAutoSave)?",
        "Gdy useEffect z logika jest dlugi albo duet stan+efekt powtarza sie w dwoch miejscach",
        "Zawsze na poczatku projektu, zanim powstanie UI",
        "Tylko gdy uzywasz class components",
        [
            "Sygnal: dlugi efekt albo duplikacja",
            "Komponent mowi CO, hook JAK",
            "Nie ekstrahuj 'na zapas'",
        ],
        "Hook ma sens, gdy izolujesz kontrakt (input -> stan/akcje) i chcesz testowac/logike uzyc ponownie. Przedwczesna ekstrakcja zwykle utrudnia refaktor UI.",
    ),
    (
        "Kiedy siegnac po Compound components?",
        "Gdy API komponentu w propsach wyglada jak konfiguracja XML (Tabs, Accordion, Menu)",
        "Zamiast kazdego controlled inputa",
        "Tylko w SSR",
        [
            "Rodzic trzyma stan, dzieci czytaja context",
            "Dobry fit: Tabs / Accordion / Menu",
            "Gdy propsy staja sie 'XML-em'",
        ],
        "Compound components daja elastyczny sklad JSX kosztem ukrytego contextu. Do prostego inputa to overkill -- do zestawu wspolpracujacych czesci UI bardzo naturalne.",
    ),
    (
        "Jaki sygnal sugeruje, ze warto przepisac kilka useState na reducer jako maszyne stanow?",
        "Trzy powiazane useState aktualizowane zawsze razem -- nielegalne przejscia nie powinny istniec w typach",
        "Masz tylko jeden boolean",
        "Chcesz uniknac TypeScript",
        [
            "Wiele pol stanu zmienia sie razem",
            "Chcesz zabronic nielegalnych kombinacji",
            "Event -> przejscie zamiast luźnych setterow",
        ],
        "Reducer/maszyna stanow swieci, gdy stany sa dyskretne i powiazane (jak Async fetcher). Przy jednym booleanie zwykle wystarczy useState.",
    ),
    (
        "Jaka jest zasada nadrzedna rozpoznawania wzorca z tresci pytania rekrutacyjnego?",
        "Najpierw wypisz slowa-klucze z tresci (dowod), potem nazwij wzorzec (wniosek) -- nigdy odwrotnie",
        "Najpierw wybierz ulubiony wzorzec, potem dopasuj tresc pytania",
        "Zawsze zaczynaj od Optimistic CRUD jako najbezpieczniejszego domyslu",
        [
            "Najpierw dowod (slowa-klucze)",
            "Potem wniosek (nazwa wzorca)",
            "Nie zgaduj 'ulubionego' wzorca",
        ],
        "Rekruterzy celowo mieszaja podobne wzorce. Jesli zaczniesz od nazwy, latwo racjonalizujesz zla odpowiedz. Dowod z tresci chroni przed ta pulapka.",
    ),
]

for question, c, w1, w2, kps, expl in ARCH_QS:
    questions.append(
        make_q(
            category="Architektura",
            difficulty="medium",
            question=question,
            key_points=kps,
            answer=f"**Odpowiedz:** {c}\n\n**Dlaczego tak:** {expl}",
            options=next_opts(c, w1, w2),
            tags=["architektura", "senior"],
        )
    )

# 9) Mapa slow-kluczy
KEYWORD_MAP = [
    (
        "'as the user types' + wyniki z API",
        "Debounced async search",
        "Auto-save form (jesli wpisywanie edytuje dane)",
        "Async dependent selects",
        "Tekst steruje wyszukiwaniem. Jesli tekst edytuje encje i pojawia sie Saved -- to juz Auto-save.",
    ),
    (
        "'auto-save' / 'Saved confirmation' / 'Saving indicator'",
        "Auto-save form",
        "Optimistic CRUD",
        "Live data / polling",
        "Status zapisu po ciszy = Auto-save. Instant bez Saved = Optimistic. Interwal bez akcji = polling.",
    ),
    (
        "'load more' / 'scroll to bottom' / 'next batch'",
        "Infinite scroll list",
        "Paginated data table (przyciski stron)",
        "Master-detail view",
        "Doklejanie porcji przy scrollu. Przyciski 'page 2 of N' + URL to inna historia.",
    ),
    (
        "'select an item' + 'show details' / 'side panel'",
        "Master-detail view",
        "Multi-step wizard",
        "File upload z progressem",
        "Wybor elementu listy otwiera detal. Forma (panel/modal) nie zmienia wzorca.",
    ),
    (
        "'add/edit/delete' + 'feel instant' / 'optimistic'",
        "Optimistic CRUD",
        "Auto-save form",
        "Debounced async search",
        "Mutacja zbioru + natychmiastowe UI i rollback. To nie search i nie Saved-after-typing.",
    ),
    (
        "'steps' / 'next/back' / 'review before submit'",
        "Multi-step wizard",
        "Auto-save form",
        "Paginated data table",
        "Orchestracja krokow i jeden finalny submit (chyba ze tresc doda auto-save).",
    ),
    (
        "'sortable columns' + 'page 2 of N' + przyciski stron",
        "Paginated data table",
        "Infinite scroll list",
        "Live data / polling",
        "Tabela z zamiana stron i zwykle stanem w URL. Nie myl z akumulujacym feedem.",
    ),
    (
        "'depends on selection' / 'cascading dropdowns' / 'when the user picks X, load Y'",
        "Async dependent selects",
        "Debounced async search (gdy tekst, nie klik)",
        "Optimistic CRUD",
        "Fetch po wyborze, nie po wpisywaniu. Reset dzieci po zmianie rodzica.",
    ),
    (
        "'upload' + 'progress bar' + 'cancel upload'",
        "File upload z progressem",
        "Auto-save form",
        "Async fetcher bez progress",
        "Progress i cancel wymagaja XHR/abort -- zwykly fetch/async fetcher nie wystarczy.",
    ),
    (
        "'refresh every X seconds' / 'live updates' / 'when the tab becomes active'",
        "Live data / polling",
        "Optimistic CRUD (instant po akcji usera)",
        "Infinite scroll list",
        "Swiezosc w czasie + pauza w tle. Instant po kliku to nie polling.",
    ),
]

for kw, c, w1, w2, why in KEYWORD_MAP:
    questions.append(
        make_q(
            category="Rozpoznawanie (kiedy uzywac)",
            difficulty="easy",
            question=f"W zadaniu slyszysz: {kw}. Jaki wzorzec?",
            key_points=[f"{kw} => {c}", "Najpierw dowod z tresci, potem nazwa"],
            answer=(
                f"**Wzorzec:** {c}\n\n"
                f"**Dlaczego:** {why}\n\n"
                f"Na rozmowie wypowiedz najpierw te slowa-klucze jako dowod, dopiero potem nazwe wzorca."
            ),
            options=next_opts(c, w1, w2),
            tags=["slowa-klucze", "rozpoznawanie"],
        )
    )

for i, item in enumerate(questions, start=1):
    item["id"] = i

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(questions, ensure_ascii=False, indent=2), encoding="utf-8")

from collections import Counter

print(f"Generated {len(questions)} questions -> {OUT}")
for cat, n in Counter(q["category"] for q in questions).most_common():
    print(f"  {n:3}  {cat}")

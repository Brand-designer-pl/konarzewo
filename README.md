# Mario-Bud — strona dewelopera

Statyczna strona prezentacyjna z animowanym przejściem wideo, galerią, interaktywnymi rzutami 2D/3D, parametrami lokalu i formularzem kontaktowym.

## Podgląd strony

https://mario-bud.com.pl/

Panel klienta: https://mario-bud.com.pl/panel/

GitHub Pages pozostaje podglądem statycznym: https://brand-designer-pl.github.io/konarzewo/

Źródła strony są w `docs/`. Produkcja działa w CyberFolks; zmiany na `main` publikuje workflow GitHub Actions. Panel i API działają na tym samym hostingu, a dane cenowe są przechowywane poza katalogiem strony. Szczegóły: `server/README.md`.

## Uruchomienie lokalne

```sh
python3 server/app.py
```

Otwórz http://localhost:8770.

## Technologia

HTML, CSS, JavaScript, GSAP i ScrollTrigger. Aktualne pliki strony i media znajdują się w `docs/`.

## Uwagi

Zdjęcia przedstawiają wcześniejsze realizacje. Wizualizacje i rzuty mają charakter koncepcyjny. Historia cen wymaga uzupełnienia przez dewelopera. Formularz przygotowuje wiadomość w aplikacji pocztowej użytkownika.

Materiały i kod udostępniono do prezentacji projektu; repozytorium nie udziela licencji na ich dalsze wykorzystanie.

## Kontrola wydajności — 26.10.2026

Sprawdzono aktywne zasoby strony głównej oraz ofert Konarzewo i Kamionki, ścieżki plików i składnię JavaScript. PNG startowe Konarzewa (6 870 149 B) zastąpiono WebP (201 506 B), filmy 16 067 888 B / 15 427 983 B zastąpiono wersjami 1 846 089 B / 1 890 337 B. Zachowano długość filmu, 30 fps i kodowanie H.264 z faststart. Zdjęcia poniżej pierwszego ekranu ładują się leniwie, mają wymiary; ticker Konarzewa nie aktualizuje DOM podczas bezczynności. Rzuty Kamionek pobierają się po wybraniu widoku. Oryginalne media pozostają jako źródła, strona korzysta z lżejszych wersji.

Nie wykonano pomiaru Core Web Vitals ani profilowania na rzeczywistym telefonie. Recenzja pomocnikiem Claude była niedostępna: brak logowania. Nie przypisano wyniku Lighthouse bez pomiaru.

### 2026-10-26 — wybór lokalu Konarzewo
Wejście do inwestycji pokazuje dwa budynki i cztery lokale A1/A2/B1/B2. Kolorowy obszar wybierany na tle białej makiety; hover, fokus klawiatury i dotyk. Cztery osobne strony lokal-*.html zachowują wcześniejszą prezentację. Parametry potwierdzone: 106,10 m² / działka ok. 350 m² / 749 000 zł. Podział graficzny poglądowy. Grafiki WebP współdzielone; brak nowego wideo i bibliotek.

2026-10-26: Widok wyboru lokali wykadrowany bez asfaltowej ulicy po prawej. Piaskowy dojazd wyprostowany w obu warstwach. Pola klikalne przeliczone do wspólnego kadru (1672 → 1480 szerokości widocznej); maska koloru pozostaje w oryginalnych współrzędnych warstwy.

2026-10-26: Dymek parametrów lokalu jako mleczne szkło z rozmyciem, podąża za kursorem i unika krawędzi ekranu. Bez przycisku CTA; tekst i strzałka sugerują kliknięcie samego lokalu. Na dotyku pierwsze dotknięcie pokazuje parametry, ponowne otwiera lokal; Enter działa bezpośrednio. Sprawdzono składnię JS i widok / nawigację klawiaturą w przeglądarce.

2026-10-26: Maska koloru płynnie interpoluje pomiędzy A1/A2/B1/B2 przez 0,8 s (ease-in-out), także przy pomijaniu lokali i przerwaniu ruchu kolejnym wyborem. Pierwsze zaznaczenie i wyjście łagodnie przenikają (0,6–0,65 s). prefers-reduced-motion wyłącza przejścia.

2026-10-26: Przyspieszono przesuwanie zaznaczenia z 0,8 do 0,42 s, z szybszym rozpędzeniem i miękkim wyhamowaniem. Przenikanie 0,32–0,36 s, reakcja etykiet 0,22 s. Zachowano reduced motion.

2026-10-26: Czerwona linia dachu w logo (także jasny wariant i animowane intro). Wspólne menu ma półprzezroczyste mleczne tło z blur od pierwszego kadru. Ocieplenie w opisach Konarzewa zmienione na styropian 15 cm; parametry Kamionek pozostawione bez zmian.

2026-10-26: Na czterech stronach lokali dodano przyklejony pod menu przełącznik A1/A2/B1/B2 z aria-current i linkiem do mapy inwestycji.

2026-10-26: Breadcrumbsy przeniesiono do powierzchni nawigacji lokali, poza slajder. Usunięto pozycjonowanie absolutne dla tych breadcrumbsów.

2026-10-26: Cały obrys domu w logo, wraz z lewą linią i podstawą, czerwony jako kontynuacja dachu. Dotyczy obu wariantów i animacji intro.

2026-10-26: Karta Konarzewa na stronie głównej oznaczona etykietą „4 dostępne lokale” na zdjęciu.

### 2026-10-26 — panel klienta, etap lokalny
Panel `/panel/`, bezpieczny serwer Python/SQLite w `server/`, wspólne dane ofert w `docs/data/offers.json`, publiczny adapter `offers.js`. Działające lokalne logowanie, zapis cen i statusów, automatyczna historia cen. Rezerwacja ma żółty stan na mapie i podpis. Publiczny snapshot pozostaje z czterema dostępnymi lokalami Konarzewa; lokalny A1 oznaczono rezerwacją wyłącznie do podglądu. Hosting nie jest jeszcze wybrany przez użytkownika, więc panel online na GitHub Pages nie ma aktywnego serwera. Instrukcja uruchomienia i dalszego wdrożenia w server/README.md. Testy API zaliczone; przeglądarka: logowanie, zapis i mapa. Claude review niedostępna z powodu braku logowania.

2026-10-26: Intro logo ma dwa następujące po sobie etapy: pojedyncza czerwona linia rysuje dach, ścianę i podstawę (1,25 s), następnie pojawia się czarny napis Mario-Bud (0,48 s z delikatną sekwencją). Potem zachowany przelot logo do menu.

2026-10-27: Panel klienta ma opcję zapamiętania logowania na 90 dni; bez konta GitHub. Bez zaznaczenia cookie sesyjne z limitem 8 godzin po stronie serwera. Wylogowanie unieważnia sesję.

2026-10-27: Panel przebudowany według monochromatycznego stylu Longwave. Strona i API Passenger/Python 3.12 wdrożone w CyberFolks, baza poza webrootem; konto administratora przeniesione bez zmiany hasła. Certyfikat Let’s Encrypt zainstalowany bez zakupu. Dodano testy WSGI i procedurę automatycznej publikacji z GitHuba po zgodzie właściciela na dedykowany klucz. Nie uruchomiono raportowania do dane.gov.pl.

2026-10-27: Panel zaczyna się od dwóch kart inwestycji ze zdjęciami, liczbą lokali, stanami dostępności i ceną od. Lokale i formularze edycji pokazują się dopiero po wybraniu Konarzewa lub Kamionek. Nawigacja boczna, powrót do inwestycji, przyciski Wstecz/Dalej przeglądarki i odświeżenie zachowują właściwy widok przez hash URL. Zapis lokalu pozostawia użytkownika w wybranej inwestycji; podsumowanie dotyczy bieżącego widoku. Sprawdzono w izolowanej bazie testowej, bez zmian w danych produkcyjnych.
Recenzja Claude tylko do odczytu: brak potwierdzonych regresji w widoku dwóch inwestycji, wyborze lokalizacji, zapisie i nawigacji. Publikacja CyberFolks zakończona sukcesem; nowy JS oraz obydwa zdjęcia odpowiadają 200 przez HTTPS. Dane i mechanizm logowania nie były zmieniane.

2026-10-27: Cztery karty lokali Konarzewa w panelu mają miniatury mapy z góry. Współdzielone warstwy osiedle-clay.webp/osiedle-color.webp i granice z publicznego units.js; tylko właściwy lokal i działka pozostają w kolorze. Etykiety A1/A2/B1/B2 oraz podpis budynku i lewej/prawej części. Bez generowania nowych obrazów i bez zmian w danych ofert; obrazy ładowane leniwie i współdzielone z pamięci przeglądarki.

2026-10-27: Baner strony głównej ma fotograficzną wizualizację tego samego budynku w ogrodzie o zachodzie słońca (mario-bud-garden-hero.webp, 1672×941, ok. 302 KB). Oryginalna makieta zachowana. Zachowany lekki zoom po scrollu; biały tekst na ciemnym gradiencie, podpis wizualizacji. Czerwień #c83732 z logo w CTA, podkreśleniach menu, krótkich liniach przy nagłówkach, ikonach parametrów i formularzu kontaktowym. Lokalny podgląd desktop: pierwszy kadr i przejście do drugiego hasła sprawdzone; nie wykonano pomiarów rzeczywistych Core Web Vitals.
Recenzja Claude tylko do odczytu: poprawiono kontrast małych podpisów przez lokalne półprzezroczyste tło; brak pozostałych potwierdzonych regresji. Nowy zasób ma uprawnienia 644.

2026-10-27: Na życzenie właściciela fotograficzny hero zastąpiony rysunkiem architektonicznym tego samego domu: cienkie grafitowe linie, jasny papier, subtelne czerwone linie konstrukcyjne. Ciemna typografia i jasny gradient dla czytelności; zachowany zoom po scrollu. Poprzednie materiały zachowane.

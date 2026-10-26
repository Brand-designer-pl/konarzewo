# Konarzewo — strona inwestycji

Statyczna strona prezentacyjna z animowanym przejściem wideo, galerią, interaktywnymi rzutami 2D/3D, parametrami lokalu i formularzem kontaktowym.

## Podgląd strony

https://brand-designer-pl.github.io/konarzewo/

GitHub Pages publikuje pliki z katalogu `docs/`, który zawiera kopię aktualnej strony z `dist/`.

## Uruchomienie lokalne

```sh
python3 -m http.server 8000 --directory dist
```

Otwórz http://localhost:8000.

## Technologia

HTML, CSS, JavaScript, GSAP i ScrollTrigger. Gotowe pliki strony i media znajdują się w `dist/`.

## Uwagi

Zdjęcia przedstawiają wcześniejsze realizacje. Wizualizacje i rzuty mają charakter koncepcyjny. Historia cen wymaga uzupełnienia przez dewelopera. Formularz przygotowuje wiadomość w aplikacji pocztowej użytkownika.

Materiały i kod udostępniono do prezentacji projektu; repozytorium nie udziela licencji na ich dalsze wykorzystanie.

## Kontrola wydajności — 26.10.2026

Sprawdzono aktywne zasoby strony głównej oraz ofert Konarzewo i Kamionki, ścieżki plików i składnię JavaScript. PNG startowe Konarzewa (6 870 149 B) zastąpiono WebP (201 506 B), filmy 16 067 888 B / 15 427 983 B zastąpiono wersjami 1 846 089 B / 1 890 337 B. Zachowano długość filmu, 30 fps i kodowanie H.264 z faststart. Zdjęcia poniżej pierwszego ekranu ładują się leniwie, mają wymiary; ticker Konarzewa nie aktualizuje DOM podczas bezczynności. Rzuty Kamionek pobierają się po wybraniu widoku. Oryginalne media pozostają jako źródła, strona korzysta z lżejszych wersji.

Nie wykonano pomiaru Core Web Vitals ani profilowania na rzeczywistym telefonie. Recenzja pomocnikiem Claude była niedostępna: brak logowania. Nie przypisano wyniku Lighthouse bez pomiaru.

### 2026-10-26 — wybór lokalu Konarzewo
Wejście do inwestycji pokazuje dwa budynki i cztery lokale A1/A2/B1/B2. Kolorowy obszar wybierany na tle białej makiety; hover, fokus klawiatury i dotyk. Cztery osobne strony lokal-*.html zachowują wcześniejszą prezentację. Parametry potwierdzone: 106,10 m² / działka ok. 350 m² / 749 000 zł. Podział graficzny poglądowy. Grafiki WebP współdzielone; brak nowego wideo i bibliotek.

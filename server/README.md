# Panel Mario-Bud

Działająca wersja lokalna i kod do wdrożenia. GitHub Pages obsługuje tylko pliki statyczne: sam adres `/panel/` na Pages nie uruchamia logowania ani zapisu. Nie ma haseł w JavaScript, kont testowych ani zapisu danych administracyjnych w localStorage.

## Uruchomienie lokalne
Wymagany Python 3.9+ (bez dodatkowych pakietów):

```sh
python3 server/app.py --init-admin --email mario.orwat@gmail.com
python3 server/app.py
```

Pierwsze polecenie pyta o hasło minimum 14 znaków. Drugie udostępnia `http://localhost:8770/panel/` i lokalny podgląd całej strony. Baza w `server/data/offers.sqlite3` jest wykluczona z Gita. Wersja lokalna jest początkowo uzupełniana danymi `docs/data/offers.json`, potem zachowuje własne zmiany między uruchomieniami. Ponowne `--init-admin` zmienia hasło i unieważnia sesje.

## Publikacja po wyborze hostingu
Potrzebna usługa uruchamiająca Python, trwały dysk na SQLite oraz HTTPS. Uruchomić proces za reverse proxy, z portem aplikacji niedostępnym bezpośrednio z Internetu. Ustawić `MB_ORIGIN=https://adres-panelu`, `MB_DB=/trwaly-dysk/offers.sqlite3`, uruchamiać `python3 server/app.py --host 127.0.0.1 --port 8770` lub dostosować interfejs do izolowanej sieci kontenera. Serwer wymaga HTTPS dla adresu publicznego. Nigdy nie ustawiać originu localhost na publicznym wdrożeniu.

Panel i API powinny być pod tą samą domeną. Publiczna strona może pozostać na GitHub Pages: w `docs/offers-config.js` ustawić `window.MB_OFFERS_URL = 'https://adres-panelu/api/offers'`. Ten endpoint zwraca wyłącznie publiczne parametry. Nie przesyłać hasła ani cookies panelu do GitHub Pages. Wariant alternatywny: obsługiwać całą stronę i panel z jednego hostingu.

Przed uruchomieniem dla klienta: utworzyć konto z własnym hasłem, ustawić HTTPS, sprawdzić zapis i odczyt z rzeczywistej domeny, kopię bazy i odtworzenie po restarcie. Wdrożenie online nie zostało wykonane: hosting nie jest jeszcze wybrany. Nie jest to deklaracja zgodności z całością obowiązków publikacji danych cenowych.

## Funkcje
- Ceny i statusy pięciu ofert (cztery lokale Konarzewa i obecny lokal lewy Kamionek).
- Dostępny, zarezerwowany, sprzedany; rezerwacja jako żółte wyróżnienie mapy.
- Historia zmian ceny zapisywana automatycznie; wcześniejsze ceny pozostają do uzupełnienia, nie tworzymy fikcyjnej historii.
- Wersjonowanie zapisu (konflikt 409 chroni przed nadpisaniem zmian z drugiej karty).
- Hasła PBKDF2, sesje HttpOnly/SameSite z terminem ważności, CSRF i sprawdzanie Origin, ograniczenie prób logowania.
- Kopie bezpieczeństwa: SQLite backup API / narzędzie sqlite3; nie kopiować aktywnej bazy bez właściwego backupu.

Testy: `python3 server/test_app.py`. Sprawdzono poprawne i błędne logowanie, blokadę innego Origin, CSRF, walidację ceny, zapis i historię, konflikt wersji, wylogowanie i publiczny odczyt. W przeglądarce sprawdzono logowanie, zapis rezerwacji A1 i żółty stan na lokalnej mapie. Testów na rzeczywistym telefonie oraz infrastruktury produkcyjnej jeszcze nie wykonano. Dodatkowa recenzja Claude niedostępna (CLI niezalogowane).

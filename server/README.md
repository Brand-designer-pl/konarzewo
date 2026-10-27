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

## Zapamiętanie logowania
Klient loguje się bezpośrednio w przeglądarce, własnym e-mailem i hasłem, bez GitHuba. Opcja „Zapamiętaj mnie na 90 dni” nadaje sesji i cookie ważność 90 dni. Bez tej opcji cookie jest sesyjne, a limit po stronie serwera to 8 godzin. Wylogowanie usuwa sesję z bazy; zmiana hasła przez --init-admin unieważnia wszystkie sesje. Hasło nie trafia do localStorage ani publicznych plików.

## Produkcja CyberFolks — 27.10.2026
- Domena `https://mario-bud.com.pl`, panel `https://mario-bud.com.pl/panel/`, publiczne API `/api/offers`.
- SSH `sentra@s189.cyber-folks.pl:222`. Istniejący lokalny dostęp: `~/.ssh/moonside_github_deploy` (nie kopiować treści do repozytorium).
- Pliki statyczne: `/home/sentra/domains/mario-bud.com.pl/public_html`; aplikacja Passenger/Python 3.12: `/home/sentra/apps/mario-bud`; baza prywatna `/home/sentra/.appdata/mario-bud/offers.sqlite3`. Zmienne MB_ORIGIN i MB_DB w konfiguracji aplikacji CloudLinux. Moduł `server/wsgi.py` udostępnia istniejącą logikę API pod montowaniem `/api`.
- Przeniesiono wyłącznie skrót dotychczasowego konta administratora. Dane ofert zainicjowano z zatwierdzonych wartości publicznych, bez lokalnej testowej rezerwacji A1. Hasło pozostaje dotychczasowe, sesje lokalne nie są przenoszone.
- `deploy/package.py` tworzy paczkę publicznych plików i kodu backendu bez danych logowania/bazy. Przygotowuje adresy nowej domeny, `/api/offers`, przekierowanie HTTPS i nagłówki panelu. Nie pakować `server/data`.
- `deploy/publish.sh` pozwala opublikować z tego komputera przez istniejący SSH. `deploy/remote-publish.sh` wykonuje kopię aktualnych plików, aktualizuje tylko katalogi Mario-Bud, zachowuje bazę i konfigurację Passenger; kopię SQLite wykonuje przez backup API. Kopie w `.appdata/mario-bud/backups`, poza publicznym katalogiem. Przy zmianach schematu przygotować osobną migrację i kopię przed nią.
- Workflow `.github/workflows/cyberfolks.yml`: testy HTTP i WSGI, przygotowanie paczki, wysłanie na CyberFolks po pushu do `main`. Osobny klucz w sekretach `MARIO_BUD_DEPLOY_KEY`, zaufane klucze hosta `MARIO_BUD_HOST_KEYS`; klucz serwera ma `restrict` i wymuszone polecenie `receive-release.sh`, bez interaktywnego SSH i przekierowania portów. Serwerowy odbiornik blokuje równoległe wdrożenia. Skrypty serwerowe zmienia się przez zaufany lokalny dostęp.
- Panel ma monochromatyczny wygląd według Longwave Boards. Zasada dla przyszłych paneli/aplikacji zapisana w nadrzędnym `Design Studio/AGENTS.md`.
- Kontrole: 4 testy HTTP oraz 2 testy WSGI (montowanie, Origin/CSRF, Secure cookies, zapamiętanie logowania, zapis/historia i trwałość), składnia JS/shell. Próba niezależnej recenzji Claude: niedostępna, CLI zgłasza brak logowania. Nie deklarować wykonanej niezależnej recenzji.
- Raportowanie cen do dane.gov.pl nie jest częścią tego wdrożenia; nie uruchomiono cyklicznego eksportu.

## Konta administratorów i mail aktywacyjny — 27.10.2026
Logo panelu zachowuje czerwoną linię marki. Profil pokazuje zalogowane konto. Sesje są przypisane do kont; migracja zachowuje dotychczasowe sesje przy jednoznacznym jednym administratorze, a nieprzypisywalne stare sesje usuwa.

Właściciel może utworzyć konto lub ponowić zaproszenie wyłącznie przez zaufany SSH/CLI:
```sh
cd /home/sentra/apps/mario-bud
MB_ORIGIN=https://mario-bud.com.pl MB_DB=/home/sentra/.appdata/mario-bud/offers.sqlite3 /home/sentra/virtualenv/apps/mario-bud/3.12/bin/python -m server.invite_admin --email ADRES
```
Komenda wysyła jedną wiadomość transakcyjną przez lokalny sendmail. Konto nowe pozostaje bez możliwości logowania, dopóki odbiorca nie ustawi hasła. Istniejącego hasła nie zmienia się przy samym wydaniu zaproszenia. Nowe zaproszenie unieważnia wcześniejsze linki tego konta. Baza przechowuje jedynie SHA-256 losowego 256-bitowego tokena, ważnego 24 godziny i jednorazowego; nie drukować linku w logach. Przy błędzie wysyłki link jest unieważniany.

Strona `/panel/ustaw-haslo.html` przyjmuje token z fragmentu URL, usuwa go z paska adresu i przekazuje do API w JSON. Samo otwarcie/sprawdzenie linku nie zużywa go. Origin jest sprawdzany; hasło minimum 14 znaków, powtarzane; zapis atomowy, unieważnienie sesji wyłącznie wskazanego konta, ponowne logowanie zwykłym formularzem. Zapis hasła powoduje dodatkową wiadomość potwierdzającą, bez hasła.

Mail `server/mail.py`: logo PNG osadzone w MIME (czerwona linia), HTML i tekst alternatywny, jasne powierzchnie/czarny przycisk, nadawca `powiadomienia@mario-bud.com.pl`, Reply-To Mariusza Orwata. Brak haseł, surowych tokenów i wiadomości użytkownika w repozytorium. SPF/DKIM domeny istnieją w DNS; przyjęcie przez sendmail nie jest samo w sobie potwierdzeniem dostarczenia do skrzynki.

Sprawdzono 6 testów WSGI i 4 HTTP; nowe testy obejmują tokeny wygasłe, ponawiane, błędne i zużyte, Origin, potwierdzenie hasła, migrację starych sesji, zachowanie sesji innego konta, strukturę MIME i wysyłkę zastąpioną atrapą. W przeglądarce wykonano ustawienie hasła i logowanie konta testowego w izolowanej lokalnej bazie. Przeprowadzono recenzję Claude tylko do odczytu. Nagłówki CSP/X-Frame-Options są ustawiane przez deploy/package.py w Apache, co potwierdzono na produkcji; kolejność komunikatu wygasłego linku poprawiono. Limit logowania dopuszcza 10 prób w oknie, blokując następną.

"""Discover client-panel offers from investment cards and their published pages."""
import json
import re
from html.parser import HTMLParser
from urllib.parse import urlsplit

SLUG = r'[a-z0-9]+(?:-[a-z0-9]+)*'


class InvestmentCards(HTMLParser):
    def __init__(self):
        super().__init__()
        self.cards = {}
        self.slug = None
        self.heading = None

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == 'a' and 'investment-card' in attrs.get('class', '').split():
            url = urlsplit(attrs.get('href', ''))
            if not url.scheme and not url.netloc:
                match = re.fullmatch(rf'(?:\./|/)?({SLUG})/', url.path)
                self.slug = match[1] if match else None
        if tag == 'h3' and self.slug:
            self.heading = []

    def handle_data(self, data):
        if self.heading is not None:
            self.heading.append(data)

    def handle_endtag(self, tag):
        if tag == 'h3' and self.heading is not None:
            name = ' '.join(''.join(self.heading).split())
            if name:
                self.cards[self.slug] = name
            self.heading = None
        if tag == 'a':
            self.slug = None


class OfferPage(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.unit = None
        self.has_summary = False
        self.feed(path.read_text(encoding='utf-8'))

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == 'body':
            self.unit = attrs.get('data-unit')
        if tag == 'section' and 'offer-summary' in attrs.get('class', '').split():
            self.has_summary = True


def offer_seed(docs):
    seed = json.loads((docs / 'data/offers.json').read_text(encoding='utf-8'))
    existing = {offer['id']: offer for offer in seed['offers']}
    cards = InvestmentCards()
    cards.feed((docs / 'index.html').read_text(encoding='utf-8'))
    for slug, investment in cards.cards.items():
        folder = docs / slug
        index = folder / 'index.html'
        if not index.is_file():
            continue
        unit_pages = sorted(path for path in folder.glob('lokal-*.html')
                            if path.is_file() and re.fullmatch(rf'lokal-{SLUG}', path.stem))
        pages = unit_pages or [index]
        identifiers = set()
        for path in pages:
            page = OfferPage(path)
            if path == index and not (page.unit or page.has_summary):
                continue
            code = path.stem.removeprefix('lokal-') if path != index else None
            identifier = page.unit or (f'{slug}-{code}' if code else slug)
            if not re.fullmatch(SLUG, identifier) or identifier in identifiers:
                raise ValueError(f'Nieprawidłowy lub powtórzony identyfikator lokalu w {path}.')
            identifiers.add(identifier)
            if identifier in existing:
                if existing[identifier]['investment'] != investment:
                    raise ValueError(f'Identyfikator {identifier} należy do innej inwestycji.')
                continue
            offer = dict(
                id=identifier, investment=investment,
                name=f'Lokal {code.upper()}' if code else f'Oferta {investment}',
                price=None, status='pending', area=None, plot=None,
                areaConfirmationPending=True, discovered=True, version=1, history=[],
            )
            existing[identifier] = offer
            seed['offers'].append(offer)
    return seed

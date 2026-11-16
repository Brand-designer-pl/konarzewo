"""Update an approved Dane.gov.pl CSV from a Mario-Bud offer snapshot."""
import argparse
import csv
import json
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from zoneinfo import ZoneInfo

WARSAW = ZoneInfo('Europe/Warsaw')
MONEY = Decimal('0.01')
DATE_FORMAT = '%Y-%m-%d %H:%M:%S'
FIELDS = ('offer_id', 'unit_price', 'unit_price_since', 'price', 'price_since')


def amount(value):
    number = Decimal(str(value).strip().replace(',', '.'))
    if not number.is_finite() or number <= 0:
        raise ValueError('Cena lub powierzchnia musi być dodatnia.')
    return number


def update_rows(rows, snapshot, columns, identifiers):
    if set(columns) != set(FIELDS) or len(set(columns.values())) != len(FIELDS):
        raise ValueError('Podaj pięć różnych nagłówków dla pól E2–E6.')
    offers = {offer['id']: offer for offer in snapshot['offers']}
    active = {key for key, offer in offers.items() if offer['status'] in ('available', 'reserved')}
    if set(identifiers.values()) != active or len(set(identifiers.values())) != len(identifiers):
        raise ValueError('Mapowanie musi obejmować każdą aktywną ofertę dokładnie raz.')
    seen = set()
    for row in rows:
        identifier = row[columns['offer_id']]
        if identifier not in identifiers or identifier in seen:
            raise ValueError(f'Brak jednoznacznego mapowania dla rekordu {identifier}.')
        seen.add(identifier)
        offer = offers[identifiers[identifier]]
        if offer.get('areaConfirmationPending'):
            raise ValueError(f'{identifier}: powierzchnia użytkowa wymaga potwierdzenia.')

        price = amount(offer['price'])
        area = amount(offer['area'])
        unit_price = (price / area).quantize(MONEY, rounding=ROUND_HALF_UP)
        history = offer.get('history') or []
        if history and amount(history[-1]['price']) != price:
            raise ValueError(f'{identifier}: historia cen nie zgadza się z aktualną ceną.')

        for field, current in (('price', price), ('unit_price', unit_price)):
            key = columns[field]
            date_key = columns[field + '_since']
            previous = row[key]
            approved_date = datetime.strptime(row[date_key], DATE_FORMAT)
            for event in reversed(history):
                old = amount(event['oldPrice'])
                old_value = old if field == 'price' else (old / area).quantize(MONEY, rounding=ROUND_HALF_UP)
                if old_value != current:
                    effective = datetime.fromisoformat(event['at'].replace('Z', '+00:00'))
                    if effective.tzinfo is None:
                        raise ValueError(f'{identifier}: data zmiany ceny nie ma strefy czasowej.')
                    effective = effective.astimezone(WARSAW).replace(tzinfo=None)
                    if effective >= approved_date:
                        approved_date = effective
                        formatted = format(current, '.2f')
                        row[key] = formatted.replace('.', ',') if ',' in previous else formatted
                        row[date_key] = approved_date.strftime(DATE_FORMAT)
                    break
            if amount(row[key]) != current:
                raise ValueError(f'{identifier}: nie udało się potwierdzić aktualnej ceny i daty jej wejścia w życie.')
    if seen != set(identifiers):
        raise ValueError('Zatwierdzony CSV nie obejmuje wszystkich aktywnych ofert.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--baseline', required=True, type=Path)
    parser.add_argument('--offers', required=True, type=Path)
    parser.add_argument('--mapping', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    try:
        mapping = json.loads(args.mapping.read_text(encoding='utf-8'))
        snapshot = json.loads(args.offers.read_text(encoding='utf-8'))
        with args.baseline.open(encoding='utf-8-sig', newline='') as source:
            dialect = csv.Sniffer().sniff(source.readline(), delimiters=';,')
            source.seek(0)
            reader = csv.DictReader(source, dialect=dialect)
            columns = reader.fieldnames
            if not columns or len(columns) != 48 or len(set(columns)) != 48:
                raise ValueError('Oczekiwano aktualnego, 48-kolumnowego wzoru CSV.')
            if not set(mapping['columns'].values()) <= set(columns):
                raise ValueError('Mapowanie nie odpowiada nagłówkom wzoru CSV.')
            rows = list(reader)
            if any(None in row or None in row.values() for row in rows):
                raise ValueError('Wiersz CSV ma nieprawidłową liczbę pól.')
        update_rows(rows, snapshot, mapping['columns'], mapping['identifiers'])
        with args.output.open('x', encoding='utf-8', newline='') as output:
            writer = csv.DictWriter(output, fieldnames=columns, dialect=dialect)
            writer.writeheader()
            writer.writerows(rows)
    except (OSError, KeyError, ValueError, TypeError, ArithmeticError, csv.Error) as error:
        parser.error(str(error))


if __name__ == '__main__':
    main()

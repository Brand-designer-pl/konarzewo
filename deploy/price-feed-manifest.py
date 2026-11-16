"""Generate the Dane.gov.pl import manifest from dated price reports."""
import argparse
import hashlib
import re
import uuid
import xml.etree.ElementTree as ET
from datetime import date
from pathlib import Path
from urllib.parse import urlsplit

NAMESPACE = 'urn:otwarte-dane:harvester:1.13'
REPORT_NAME = re.compile(r'ceny-(\d{4}-\d{2}-\d{2})\.csv')
DESCRIPTION = 'Ceny ofertowe nieruchomości zgodnie z art. 19b ust. 1 ustawy deweloperskiej.'
EN_DESCRIPTION = 'Property offer prices under Article 19b(1) of the Polish development act.'


def bilingual(parent, key, polish, english):
    element = ET.SubElement(parent, key)
    ET.SubElement(element, 'polish').text = polish
    ET.SubElement(element, 'english').text = english


def flags(element):
    for key, value in (
        ('hasDynamicData', 'false'),
        ('hasHighValueData', 'true'),
        ('hasHighValueDataFromEuropeanCommissionList', 'false'),
        ('hasResearchData', 'false'),
    ):
        ET.SubElement(element, key).text = value


def manifest(reports, base_url, developer, dataset_id):
    url = urlsplit(base_url)
    if url.scheme != 'https' or not url.hostname or url.username or url.query or url.fragment:
        raise ValueError('Podaj stały adres HTTPS katalogu raportów.')

    dated_reports = []
    for report in sorted(reports.glob('ceny-*.csv')):
        match = REPORT_NAME.fullmatch(report.name)
        if not match or not report.is_file() or not report.stat().st_size:
            raise ValueError(f'Nieprawidłowy plik raportu: {report.name}')
        dated_reports.append((date.fromisoformat(match[1]), report.name))
    if not dated_reports:
        raise ValueError('Katalog nie zawiera raportów ceny-RRRR-MM-DD.csv.')

    ET.register_namespace('harvester', NAMESPACE)
    root = ET.Element(f'{{{NAMESPACE}}}datasets')
    dataset = ET.SubElement(root, 'dataset', status='published')
    ET.SubElement(dataset, 'extIdent').text = str(dataset_id)
    bilingual(dataset, 'title', f'Ceny ofertowe nieruchomości – {developer}', f'Property offer prices – {developer}')
    bilingual(dataset, 'description', DESCRIPTION, EN_DESCRIPTION)
    ET.SubElement(dataset, 'updateFrequency').text = 'daily'
    flags(dataset)
    ET.SubElement(ET.SubElement(dataset, 'categories'), 'category').text = 'ECON'
    resources = ET.SubElement(dataset, 'resources')
    for day, filename in dated_reports:
        resource = ET.SubElement(resources, 'resource', status='published')
        ET.SubElement(resource, 'extIdent').text = str(uuid.uuid5(dataset_id, day.isoformat()))
        ET.SubElement(resource, 'url').text = f'{base_url.rstrip("/")}/{filename}'
        bilingual(resource, 'title', f'{developer} – ceny na {day}', f'{developer} – prices on {day}')
        bilingual(resource, 'description', DESCRIPTION, EN_DESCRIPTION)
        ET.SubElement(resource, 'availability').text = 'local'
        ET.SubElement(resource, 'dataDate').text = day.isoformat()
        ET.SubElement(ET.SubElement(resource, 'specialSigns'), 'specialSign').text = 'X'
        flags(resource)
        ET.SubElement(resource, 'containsProtectedData').text = 'false'
    ET.SubElement(ET.SubElement(dataset, 'tags'), 'tag', lang='pl').text = 'Deweloper'
    ET.indent(root)
    return ET.tostring(root, encoding='utf-8', xml_declaration=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--reports', required=True, type=Path)
    parser.add_argument('--base-url', required=True)
    parser.add_argument('--developer', required=True)
    parser.add_argument('--dataset-id', required=True, type=uuid.UUID)
    parser.add_argument('--output', required=True, type=Path, help='Ścieżka pliku XML w katalogu roboczym')
    args = parser.parse_args()
    try:
        data = manifest(args.reports, args.base_url, args.developer, args.dataset_id)
    except ValueError as error:
        parser.error(str(error))
    args.output.write_bytes(data)
    args.output.with_suffix('.md5').write_text(hashlib.md5(data).hexdigest() + '\n', encoding='ascii')


if __name__ == '__main__':
    main()

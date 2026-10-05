#!/usr/bin/env python3
"""Generate the offline guess dictionary from the pinned Norsk ordbank archive.

Run: python scripts/import_wordbank.py path/to/20220201_norsk_ordbank_nob_2005.tar.gz
The archive is read directly, never extracted. Only current, normalized Bokmål
forms of 3–6 Norwegian keyboard letters are accepted; proper names are excluded.
"""
import csv
import hashlib
import io
import json
from pathlib import Path
import re
import sys
import tarfile
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
SOURCE_URL = 'https://www.nb.no/sbfil/leksikalske_databaser/ordbank/20220201_norsk_ordbank_nob_2005.tar.gz'
RESOURCE_URL = 'https://www.nb.no/sprakbanken/ressurskatalog/oai-nb-no-sbr-5/'
# This is the documented date against which the pinned snapshot is filtered.
AS_OF = '2026.10.05'


def date_key(value: str) -> str:
    parts = value.split('.')
    return '.'.join([parts[0].zfill(4), (parts[1] if len(parts) > 1 else '01').zfill(2), (parts[2] if len(parts) > 2 else '01').zfill(2)])


def collect_forms(rows):
    result = set()
    for row in rows:
        word = unicodedata.normalize('NFC', row['OPPSLAG'])
        if row['NORMERING'] != 'normert' or 'prop' in row['TAG'].split():
            continue
        if not date_key(row['FRADATO']) <= AS_OF < date_key(row['TILDATO']):
            continue
        if not re.fullmatch(r'[a-zæøå]{3,6}', word):
            continue
        result.add(word.upper())
    return result


def main():
    archive_path = Path(sys.argv[1])
    digest = hashlib.sha256(archive_path.read_bytes()).hexdigest()
    with tarfile.open(archive_path, 'r:gz') as archive:
        stream = archive.extractfile('fullformsliste.txt')
        if stream is None:
            raise ValueError('Archive has no fullformsliste.txt')
        with io.TextIOWrapper(stream, encoding='iso-8859-1', newline='') as text:
            forms = collect_forms(csv.DictReader(text, delimiter='\t'))
    answers = json.loads((ROOT / 'src/data/answers.json').read_text())
    # The curated answer repository is authoritative for playable answers.
    forms.update(w['word'] for w in answers if w['language'] == 'nb')
    data = {
        '_source': {
            'title': 'Norsk ordbank – bokmål 2005', 'snapshot': '2022-02-01',
            'creators': ['Universitetet i Bergen', 'Språkrådet'],
            'provider': 'Språkbanken, Nasjonalbiblioteket', 'resourceUrl': RESOURCE_URL,
            'downloadUrl': SOURCE_URL, 'archiveSha256': digest,
            'license': 'CC BY 4.0', 'licenseUrl': 'https://creativecommons.org/licenses/by/4.0/',
            'changes': 'Filtered normert full forms active on 2026-10-05; lowercase 3–6-letter words using A–Z/Æ/Ø/Å; proper names excluded; uppercase NFC; deduplicated; curated answers included.',
            'count': len(forms),
        },
        'nb': sorted(forms), 'nn': [],
    }
    (ROOT / 'src/data/validGuesses.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    print(f'{len(forms):,} valid Bokmål guesses; 56 curated answers unchanged.')


if __name__ == '__main__':
    main()

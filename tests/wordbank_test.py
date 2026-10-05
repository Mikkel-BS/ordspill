import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from import_wordbank import collect_forms


def row(word, **changes):
    return {'OPPSLAG': word, 'NORMERING': 'normert', 'TAG': 'verb imp normert', 'FRADATO': '1996', 'TILDATO': '4000', **changes}


class WordbankImportTests(unittest.TestCase):
    def test_valid_inflections_and_norwegian_letters(self):
        self.assertEqual(collect_forms([row('snu'), row('fått'), row('bøker'), row('ære'), row('snu')]), {'SNU', 'FÅTT', 'BØKER', 'ÆRE'})

    def test_excludes_names_unofficial_and_obsolete_forms(self):
        self.assertEqual(collect_forms([row('ola', TAG='subst prop normert'), row('Ola'), row('gikk', NORMERING='unormert'), row('løpe', TILDATO='2020.01.01'), row('fikk', FRADATO='2030')]), set())

    def test_excludes_unsupported_letters_punctuation_and_lengths(self):
        self.assertEqual(collect_forms([row('kafé'), row('bil-en'), row('og'), row('stjerne'), row('bil')]), {'BIL'})


if __name__ == '__main__':
    unittest.main()

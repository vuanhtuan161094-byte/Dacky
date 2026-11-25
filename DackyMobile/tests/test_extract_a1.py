import unittest

from scripts.extract_a1 import decode_mysql50_datetime, validate_descriptors


class DescriptorValidationTests(unittest.TestCase):
    def test_allows_zero_length_null_bitmap_descriptor(self):
        validate_descriptors([
            (0, 0, 0, 0),
            (8, 91, 0, 0),
            (3, 4, 0, 0),
        ])

    def test_allows_nonempty_null_bitmap_descriptor(self):
        validate_descriptors([
            (0, 1, 0, 0),
            (3, 1, 1, 0),
        ])

    def test_rejects_zero_length_physical_field(self):
        with self.assertRaisesRegex(ValueError, 'unsupported descriptor layout'):
            validate_descriptors([(0, 0, 0, 0), (3, 0, 0, 0)])

    def test_rejects_unsupported_descriptor_type(self):
        with self.assertRaisesRegex(ValueError, 'unsupported descriptor layout'):
            validate_descriptors([(0, 0, 0, 0), (7, 1, 0, 0)])

    def test_requires_null_bitmap_descriptor(self):
        with self.assertRaisesRegex(ValueError, 'unsupported descriptor layout'):
            validate_descriptors([(3, 1, 0, 0)])


class MySQL50DateTimeTests(unittest.TestCase):
    def test_decodes_legacy_little_endian_datetime_without_timezone(self):
        packed = 20261125123456
        decoded = decode_mysql50_datetime(packed.to_bytes(8, "little"))
        self.assertEqual(decoded, {
            "raw": packed,
            "value": "2026-11-25 12:34:56",
            "encoding": "MYSQL50_DATETIME_U64_LE_YYYYMMDDHHMMSS",
        })

    def test_preserves_mysql_zero_datetime(self):
        decoded = decode_mysql50_datetime(bytes(8))
        self.assertEqual(decoded["raw"], 0)
        self.assertEqual(decoded["value"], "0000-00-00 00:00:00")

    def test_rejects_bad_width_and_components(self):
        with self.assertRaisesRegex(ValueError, "width"):
            decode_mysql50_datetime(bytes(7))
        with self.assertRaisesRegex(ValueError, "components"):
            decode_mysql50_datetime((20261301120000).to_bytes(8, "little"))


if __name__ == '__main__':
    unittest.main()

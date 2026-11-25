import unittest

from scripts.extract_a1 import validate_descriptors


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


if __name__ == '__main__':
    unittest.main()

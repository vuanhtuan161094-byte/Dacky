import json
import tempfile
import unittest
from pathlib import Path

from scripts.extract_a1 import digest
from scripts.normalize_legacy_research import normalize_table


class LegacyNormalizationTests(unittest.TestCase):
    def test_normalizes_private_rows_with_per_field_source_hashes(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            extracted = root / "extracted"
            cache = root / "cache"
            output = root / "normalized"
            extracted.mkdir()
            cache.mkdir()
            source_commit = "13d969fc88c141553535c70943aaa98cf9f86616"
            blobs = {"frm": b"schema", "MYI": b"index", "MYD": b"rows"}
            for ext, content in blobs.items():
                (cache / f"sample.{ext}").write_bytes(content)
            hashes = {ext: digest(content) for ext, content in blobs.items()}
            payload = {
                "source_commit": source_commit,
                "source_git_blob_sha1": hashes["MYD"],
                "status": "LEGACY_NOT_MOBILE_VERIFIED",
                "schema": [
                    {"name": "id", "type": 3, "flags": 1},
                    {"name": "when", "type": 12, "flags": 0,
                     "storage_encoding": "MYSQL50_DATETIME_U64_LE_YYYYMMDDHHMMSS"},
                ],
                "records": [{"id": 7, "when": {"raw": 0, "value": "0000-00-00 00:00:00"}}],
            }
            (extracted / "sample.json").write_text(json.dumps(payload), encoding="utf-8")
            metadata = {
                "status": "DECODED", "rows": 1, "mode": "fixed",
                "frm_sha1": hashes["frm"], "index_sha1": hashes["MYI"], "data_sha1": hashes["MYD"],
            }
            result = normalize_table("sample", metadata, extracted, cache, output, source_commit)
            normalized = json.loads((output / "sample.json").read_text(encoding="utf-8"))

            self.assertEqual(result["rows"], 1)
            self.assertEqual(normalized["records"][0]["id"], 7)
            when = normalized["schema"][1]
            self.assertEqual(when["semanticStatus"], "UNKNOWN")
            self.assertEqual(when["provenance"]["sourceField"], "when")
            self.assertEqual(when["provenance"]["dataBlobSha1"], hashes["MYD"])
            self.assertEqual(normalized["licenseStatus"], "OWNER_AUTHORIZATION_NO_SPDX_REQUIRED")
            self.assertEqual(normalized["redistributionStatus"], "RAW_DATABASE_DUMP_KEPT_PRIVATE")

    def test_rejects_source_blob_hash_mismatch(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            extracted = root / "extracted"
            cache = root / "cache"
            extracted.mkdir()
            cache.mkdir()
            (cache / "sample.frm").write_bytes(b"schema")
            (cache / "sample.MYI").write_bytes(b"index")
            (cache / "sample.MYD").write_bytes(b"rows")
            payload = {
                "source_commit": "13d969fc88c141553535c70943aaa98cf9f86616",
                "source_git_blob_sha1": digest(b"wrong"),
                "status": "LEGACY_NOT_MOBILE_VERIFIED", "schema": [], "records": [],
            }
            (extracted / "sample.json").write_text(json.dumps(payload), encoding="utf-8")
            meta = {"status": "DECODED", "rows": 0, "frm_sha1": digest(b"schema"),
                    "index_sha1": digest(b"index"), "data_sha1": digest(b"rows")}
            with self.assertRaisesRegex(ValueError, "extract.*hash"):
                normalize_table("sample", meta, extracted, cache, root / "out", payload["source_commit"])


if __name__ == "__main__":
    unittest.main()

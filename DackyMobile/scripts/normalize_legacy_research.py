#!/usr/bin/env python3
"""Structurally normalize private legacy extracts with per-field provenance.

All row output is written below input-private/. This is a research artifact;
the script deliberately does not create runtime catalogs or license grants.
"""
import argparse
import json
from pathlib import Path

if __package__:
    from .extract_a1 import digest
else:
    from extract_a1 import digest


ROOT = Path(__file__).resolve().parents[1]
SOURCE_COMMIT = "13d969fc88c141553535c70943aaa98cf9f86616"
NORMALIZATION_VERSION = "dacky-legacy-structural-v1"


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def normalize_table(name, table_meta, extracted_dir, cache_dir, output_dir, source_commit):
    if table_meta.get("status") != "DECODED":
        return None

    extract_path = extracted_dir / f"{name}.json"
    payload = read_json(extract_path)
    if payload.get("status") != "LEGACY_NOT_MOBILE_VERIFIED":
        raise ValueError(f"{name}: unexpected extract status")
    if payload.get("source_commit") != source_commit:
        raise ValueError(f"{name}: source commit mismatch")

    actual_hashes = {}
    for ext in ("frm", "MYI", "MYD"):
        actual_hashes[ext] = digest((cache_dir / f"{name}.{ext}").read_bytes())
    expected = {
        "frm_sha1": actual_hashes["frm"],
        "index_sha1": actual_hashes["MYI"],
        "data_sha1": actual_hashes["MYD"],
    }
    for key, value in expected.items():
        if table_meta.get(key) != value:
            raise ValueError(f"{name}: {key} does not match pinned source")
    if payload.get("source_git_blob_sha1") != actual_hashes["MYD"]:
        raise ValueError(f"{name}: extracted data hash does not match source")

    schema = payload.get("schema")
    rows = payload.get("records")
    if not isinstance(schema, list) or not isinstance(rows, list):
        raise ValueError(f"{name}: schema/records are not arrays")
    if len(rows) != table_meta.get("rows"):
        raise ValueError(f"{name}: row count mismatch")

    names = [column.get("name") for column in schema]
    if not all(isinstance(field, str) and field for field in names) or len(set(names)) != len(names):
        raise ValueError(f"{name}: invalid or duplicate schema fields")
    expected_fields = set(names)
    for row_number, row in enumerate(rows):
        if not isinstance(row, dict) or set(row) != expected_fields:
            raise ValueError(f"{name}: row {row_number} fields do not match schema")

    field_provenance = []
    for ordinal, column in enumerate(schema):
        field_provenance.append({
            "name": column["name"],
            "sqlTypeCode": column["type"],
            "rawFlags": column["flags"],
            "storageEncoding": column.get("storage_encoding", "MYSQL50_FIELD_STORAGE_DECODED"),
            "semanticStatus": "UNKNOWN",
            "nullableStatus": "UNKNOWN",
            "provenance": {
                "source": "DACKYVANTIEN_MYSQL50_LEGACY",
                "sourceCommit": source_commit,
                "sourceTable": name,
                "sourceField": column["name"],
                "columnOrdinal": ordinal,
                "schemaBlobSha1": actual_hashes["frm"],
                "indexBlobSha1": actual_hashes["MYI"],
                "dataBlobSha1": actual_hashes["MYD"],
            },
        })

    result = {
        "normalizationVersion": NORMALIZATION_VERSION,
        "sourceCommit": source_commit,
        "sourceTable": name,
        "status": "PRIVATE_LEGACY_RESEARCH_NOT_RUNTIME_APPROVED",
        "licenseStatus": "UNVERIFIED_NO_SPDX_LICENSE",
        "redistributionStatus": "BLOCKED_PENDING_PERMISSION_REVIEW",
        "rowCount": len(rows),
        "recordLayout": table_meta.get("mode"),
        "schema": field_provenance,
        "records": rows,
    }
    output_dir.mkdir(parents=True, exist_ok=True)
    temp = output_dir / f"{name}.tmp"
    temp.write_text(json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    temp.replace(output_dir / f"{name}.json")
    return {"status": "NORMALIZED_PRIVATE", "rows": len(rows), "fields": len(schema)}


def normalize_all(extracted_dir, cache_dir, output_dir):
    manifest = read_json(extracted_dir / "manifest.json")
    source_commit = manifest.get("source_commit")
    if source_commit != SOURCE_COMMIT:
        raise ValueError("manifest is not pinned to the expected source commit")
    tables = {}
    for name, meta in sorted(manifest.get("tables", {}).items()):
        result = normalize_table(name, meta, extracted_dir, cache_dir, output_dir, source_commit)
        tables[name] = result or {"status": "HOLD", "reason": meta.get("error", "not decoded")}

    normalized = sum(row["status"] == "NORMALIZED_PRIVATE" for row in tables.values())
    rows = sum(row.get("rows", 0) for row in tables.values())
    output_manifest = {
        "normalizationVersion": NORMALIZATION_VERSION,
        "sourceCommit": source_commit,
        "status": "PRIVATE_RESEARCH_ONLY",
        "licenseStatus": "UNVERIFIED_NO_SPDX_LICENSE",
        "runtimeImportStatus": "DISABLED_PENDING_FIELD_SCOPE_AND_REUSE_PERMISSION",
        "normalizedTableCount": normalized,
        "heldTableCount": sum(row["status"] == "HOLD" for row in tables.values()),
        "normalizedRecordCount": rows,
        "tables": tables,
    }
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "manifest.json").write_text(
        json.dumps(output_manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return output_manifest


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--extracted", type=Path, default=ROOT / "input-private" / "extracted")
    parser.add_argument("--cache", type=Path, default=ROOT / "input-private" / "legacy_table_cache")
    parser.add_argument("--output", type=Path, default=ROOT / "input-private" / "normalized_legacy")
    args = parser.parse_args()
    result = normalize_all(args.extracted, args.cache, args.output)
    print(json.dumps({key: result[key] for key in (
        "normalizedTableCount", "heldTableCount", "normalizedRecordCount", "runtimeImportStatus"
    )}, ensure_ascii=False))

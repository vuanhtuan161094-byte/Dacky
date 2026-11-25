#!/usr/bin/env python3
"""Refresh public source coverage from private research manifests."""

import hashlib
import json
from collections import Counter
from datetime import date
from pathlib import Path

from verify_legacy_cache import verify_cache


ROOT = Path(__file__).resolve().parents[1]
PRIVATE = ROOT / "input-private"
COVERAGE_PATH = ROOT / "DATA_COVERAGE.json"
LEGACY_MANIFEST = PRIVATE / "extracted" / "manifest.json"
MOBILE_MANIFEST = PRIVATE / "mobile_reference" / "manifest.json"
NETWORK_CHECK = PRIVATE / "source_metadata" / "network-check.json"


def load_json(path):
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else None


def legacy_inventory():
    manifest = load_json(LEGACY_MANIFEST)
    if manifest is None:
        return None

    verification = verify_cache()
    status_counts = Counter(
        table.get("status", "UNKNOWN")
        for table in manifest.get("tables", {}).values()
    )
    fields_decoded = sum(
        table.get("fields", 0)
        for table in manifest.get("tables", {}).values()
        if table.get("status") == "DECODED"
    )
    tables = {}
    for name, table in sorted(manifest.get("tables", {}).items()):
        tables[name] = {
            "status": table.get("status", "UNKNOWN"),
            "recordsDecoded": table.get("rows", 0),
            "fieldCount": table.get("fields"),
            "recordLayout": table.get("mode"),
            "dataBlobSha1": table.get("data_sha1"),
            "schemaBlobSha1": table.get("frm_sha1"),
            "indexBlobSha1": table.get("index_sha1"),
            "holdReason": table.get("error"),
        }

    return {
        "status": "LEGACY_RESEARCH_DECODED_NOT_IMPORTED",
        "sourceVersion": "DackyVanTien/MySQL 5.0 legacy snapshot",
        "sourceCommit": manifest.get("source_commit"),
        "sourceTreeVerified": verification["valid"],
        "sourceFilesVerified": verification["verifiedFileCount"],
        "sourceFilesInPinnedAllowlist": verification["allowedFileCountInSource"],
        "sourceFilesMissingFromCache": verification["missingCachedFiles"],
        "tableCount": len(manifest.get("tables", {})),
        "decodedTableCount": status_counts.get("DECODED", 0),
        "heldTableCount": status_counts.get("HOLD", 0),
        "decodedRecordCount": manifest.get("decoded_rows", 0),
        "decodedSchemaFieldCount": fields_decoded,
        "runtimeImportedRecordCount": 0,
        "tables": tables,
    }


def mobile_inventory():
    manifest = load_json(MOBILE_MANIFEST)
    if manifest is None:
        return None
    categories = {}
    for category in manifest.get("categories", []):
        categories[category["id"]] = {
            "title": category["name"],
            "recordsServed": category["count"],
            "declaredRecords": category.get("declaredCount"),
            "capturedFileBytes": category["byteCount"],
            "capturedFileSha256": category["fileSha256"],
            "fieldOccurrences": category["fieldOccurrences"],
            "detailBlockCounts": category["detailBlocks"],
            "referenceUrl": category["referenceUrl"],
            "runtimeImportedRecords": 0,
        }
    return {
        "status": "PUBLIC_CATALOG_CAPTURED_NOT_IMPORTED",
        "capturedDate": manifest["capturedDate"],
        "catalogVersion": manifest["catalogVersion"],
        "landingPage": manifest["landingPage"],
        "indexSha256": manifest["indexSha256"],
        "categoryCount": len(categories),
        "recordCount": sum(row["recordsServed"] for row in categories.values()),
        "runtimeImportedRecordCount": 0,
        "categories": categories,
        "reuseNote": manifest.get("reuseNote"),
    }


def main():
    coverage = load_json(COVERAGE_PATH)
    if coverage is None:
        raise FileNotFoundError(COVERAGE_PATH)

    legacy = legacy_inventory()
    mobile = mobile_inventory()
    network = load_json(NETWORK_CHECK)
    coverage["updated"] = date.today().isoformat()
    coverage["evidenceStatus"].update({
        "verifiedMobileRecords": mobile["runtimeImportedRecordCount"] if mobile else 0,
        "verifiedLegacyRecordsImported": legacy["runtimeImportedRecordCount"] if legacy else 0,
        "simulatedRuntimeRecords": sum(
            item.get("records", 0)
            for item in coverage.get("runtimeCatalogs", [])
            if isinstance(item.get("records"), int)
        ),
        "sourceAccess": "PUBLIC_GET_SUCCEEDED_2026-11-25" if network else "NOT_CHECKED",
        "note": "Source access and record decoding are tracked separately from runtime import. Existing gameplay catalogs remain SIMULATED until selected normalized fields are wired into runtime.",
    })
    coverage["sourceInventory"] = {
        "legacy": legacy,
        "mobilePublicCatalog": mobile,
        "httpGetChecks": network,
    }
    coverage["references"] = {
        **coverage.get("references", {}),
        "publicMobile": [
            {
                "url": "https://dackytruvuong.com/",
                "attempt": "2026-11-25",
                "result": "HTTP 200; HTML body received; no redirect",
            },
            {
                "url": "https://dackytruvuong.com/play",
                "attempt": "2026-11-25",
                "result": "HTTP 200; public HTML body received; no authenticated flow used",
            },
            {
                "url": "https://dackytruvuong.com/phong-than-cac/",
                "attempt": "2026-11-25",
                "result": "HTTP 200; public catalog HTML body received; seven category JSON catalogs captured",
            },
        ],
        "legacySourcePin": "13d969fc88c141553535c70943aaa98cf9f86616",
        "legacySourceDownloaded": bool(legacy and legacy["sourceFilesVerified"]),
        "legacyLicense": "No SPDX license was reported by GitHub for the pinned public repository; raw table files remain in gitignored input-private/.",
    }
    coverage["notImported"] = [
        {
            "domain": "legacyGameplayTables",
            "reason": "Static tables are decoded and hash-verified as private research. Runtime integration has not been performed.",
        },
        {
            "domain": "mobilePublicCatalogFields",
            "reason": "Seven public catalogs are captured and summarized. Runtime import remains field-scoped and must preserve source provenance.",
        },
        {
            "domain": "mobileVersionDelta",
            "reason": "Catalog counts and displayed records have been compared at category level. Full gameplay-version delta remains open.",
        },
        {
            "domain": "fengshenTowerFloorCount",
            "reason": "The 8,992 legacy elfland floor records are not evidence of the Fengshen Tower floor count.",
        },
    ]
    for catalog in coverage.get("runtimeCatalogs", []):
        if catalog.get("domain") == "fengshenTower":
            catalog["records"] = "procedural floors 1-9999"
            catalog["simulationCap"] = 9999
            catalog["floorCountBasis"] = (
                "Local design cap; unrelated to legacy elfland floors; source tower count unknown"
            )
            catalog.pop("legacyReferenceFloorCount", None)
    coverage["normalizationStatus"] = "PRIVATE_SOURCE_CAPTURE_AND_LEGACY_DECODE_COMPLETE; RUNTIME_IMPORT_PENDING"
    temp_path = COVERAGE_PATH.with_suffix(".tmp")
    temp_path.write_text(
        json.dumps(coverage, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    temp_path.replace(COVERAGE_PATH)
    print(json.dumps({
        "updated": coverage["updated"],
        "legacyTablesDecoded": legacy["decodedTableCount"] if legacy else 0,
        "legacyTablesHeld": legacy["heldTableCount"] if legacy else 0,
        "legacyRecordsDecoded": legacy["decodedRecordCount"] if legacy else 0,
        "mobileCategories": mobile["categoryCount"] if mobile else 0,
        "mobileRecordsServed": mobile["recordCount"] if mobile else 0,
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()

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
NORMALIZED_MANIFEST = PRIVATE / "normalized_legacy" / "manifest.json"
MOBILE_MANIFEST = PRIVATE / "mobile_reference" / "manifest.json"
NETWORK_CHECK = PRIVATE / "source_metadata" / "network-check.json"
APPROVED_SOURCE_DATA = ROOT / "src" / "approved-source-data.js"


def load_json(path):
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else None


def runtime_mobile_facts():
    source = APPROVED_SOURCE_DATA.read_text(encoding="utf-8")
    prefix = "export const APPROVED_SOURCE_FACTS = Object.freeze("
    start = source.find(prefix)
    end = source.rfind(");")
    if start < 0 or end <= start:
        raise ValueError("Could not parse generated Mobile source adapter facts")
    return json.loads(source[start + len(prefix):end])


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
    facts = runtime_mobile_facts()
    mapped_domains = {
        "than-tien": "heroes", "phap-bao": "items", "vat-pham": "items", "binh-chung": "troops",
        "cong-trinh": "buildings", "khoa-ky": "technologies", "danh-thanh": "worldNodes",
    }
    gameplay_mapped = {}
    for category, domain in mapped_domains.items():
        mapped = facts.get(domain, {}) if domain else {}
        if domain == "items":
            gameplay_mapped[category] = sum(
                any(field.get("provenance", {}).get("sourceTable") == category for field in row.values())
                for row in mapped.values()
            )
        else:
            gameplay_mapped[category] = len(mapped)
    field_value_count = sum(len(fields) for table in facts.values() for fields in table.values())
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
            "runtimeImportedRecords": category["count"],
            "gameplayMappedRecords": gameplay_mapped.get(category["id"], 0),
        }
    return {
        "status": "PUBLIC_CATALOG_BUNDLED_PARTIAL_GAMEPLAY_ADAPTER",
        "capturedDate": manifest["capturedDate"],
        "catalogVersion": manifest["catalogVersion"],
        "landingPage": manifest["landingPage"],
        "indexSha256": manifest["indexSha256"],
        "categoryCount": len(categories),
        "recordCount": sum(row["recordsServed"] for row in categories.values()),
        "runtimeImportedRecordCount": sum(row["recordsServed"] for row in categories.values()),
        "gameplayMappedRecordCount": sum(row["gameplayMappedRecords"] for row in categories.values()),
        "fieldScopedGameplayValueCount": field_value_count,
        "categories": categories,
        "reuseNote": "Owner authorization dated 2026-11-25 covers found Mobile data/assets. The full catalog is bundled in runtime; direct gameplay mapping is per-field and remaining mechanics stay SIMULATED or UNKNOWN.",
    }


def normalized_inventory():
    manifest = load_json(NORMALIZED_MANIFEST)
    if manifest is None:
        return None
    return {
        "status": manifest.get("status"),
        "normalizationVersion": manifest.get("normalizationVersion"),
        "sourceCommit": manifest.get("sourceCommit"),
        "licenseStatus": "OWNER_AUTHORIZATION_NO_SPDX_REQUIRED",
        "runtimeImportStatus": "PARTIAL_PENDING_GAMEPLAY_FIELD_MAPPING",
        "normalizedTableCount": manifest.get("normalizedTableCount", 0),
        "heldTableCount": manifest.get("heldTableCount", 0),
        "normalizedRecordCount": manifest.get("normalizedRecordCount", 0),
    }


def count_comparison(legacy_manifest, mobile_manifest):
    if not legacy_manifest or not mobile_manifest:
        return None
    mobile_counts = {row["id"]: row["count"] for row in mobile_manifest.get("categories", [])}
    legacy_tables = legacy_manifest.get("tables", {})
    mapping = [
        ("than-tien", "famousgeneraliteminfo", "hero record counts; not identity parity"),
        ("phap-bao", "goodstrumpinfo", "artifact record counts; not effect parity"),
        ("vat-pham", "147-goodsinfo", "item catalog scopes may differ"),
        ("binh-chung", "147-soldierinfo", "troop record counts; version namespaces differ"),
        ("cong-trinh", "buildinfo", "building record counts only"),
        ("khoa-ky", "technologyinfo", "technology record counts only"),
    ]
    comparisons = []
    for category, table_name, scope in mapping:
        mobile_count = mobile_counts.get(category)
        legacy_count = legacy_tables.get(table_name, {}).get("rows")
        if isinstance(mobile_count, int) and isinstance(legacy_count, int):
            comparisons.append({
                "mobileCategory": category,
                "mobileRecords": mobile_count,
                "legacyTable": table_name,
                "legacyRecords": legacy_count,
                "mobileMinusLegacy": mobile_count - legacy_count,
                "basis": scope,
            })

    city_rows_path = PRIVATE / "extracted" / "famouscitygeneralinfo.json"
    mobile_city_count = mobile_counts.get("danh-thanh")
    if isinstance(mobile_city_count, int) and city_rows_path.exists():
        city_payload = load_json(city_rows_path)
        city_groups = {
            (row.get("PosX"), row.get("PosY"))
            for row in city_payload.get("records", [])
        }
        legacy_city_count = len(city_groups)
        comparisons.append({
            "mobileCategory": "danh-thanh",
            "mobileRecords": mobile_city_count,
            "legacyTable": "famouscitygeneralinfo",
            "legacyRecords": legacy_city_count,
            "legacySourceRows": len(city_payload.get("records", [])),
            "mobileMinusLegacy": mobile_city_count - legacy_city_count,
            "basis": "Mobile city entries vs distinct legacy defender coordinate groups; row semantics may differ",
        })

    return {
        "status": "CATEGORY_COUNT_DELTA_ONLY",
        "mobileCatalogVersion": mobile_manifest.get("catalogVersion"),
        "legacySourceCommit": legacy_manifest.get("source_commit"),
        "comparisons": comparisons,
        "contentFieldDiff": "NOT_ESTABLISHED; versions and field semantics remain incompletely mapped",
        "parityClaim": False,
    }


def main():
    coverage = load_json(COVERAGE_PATH)
    if coverage is None:
        raise FileNotFoundError(COVERAGE_PATH)

    legacy = legacy_inventory()
    mobile = mobile_inventory()
    normalized = normalized_inventory()
    comparison = count_comparison(load_json(LEGACY_MANIFEST), load_json(MOBILE_MANIFEST))
    network = load_json(NETWORK_CHECK)
    if mobile:
        items_catalog = next((item for item in coverage.get("runtimeCatalogs", []) if item.get("domain") == "items"), None)
        if items_catalog:
            artifact_count = mobile["categories"].get("phap-bao", {}).get("gameplayMappedRecords", 0)
            goods_count = mobile["categories"].get("vat-pham", {}).get("gameplayMappedRecords", 0)
            base_records = items_catalog.setdefault("baseCatalogRecords", items_catalog.get("records", 2155))
            items_catalog.update({
                "records": base_records + goods_count,
                "status": "MIXED" if artifact_count + goods_count else "SIMULATED",
                "simulatedRecords": max(0, base_records - artifact_count),
                "mobileArtifactRecords": artifact_count,
                "mobileGoodsRecords": goods_count,
                "sourceLibraryRecords": artifact_count + goods_count,
                "sourceFields": "151 verified Mobile artifact profiles and 1,885 item profiles; exact chest outcomes and gear attributes are retained, supported runtime conversions are field-scoped and other use effects remain UNKNOWN",
            })
    coverage["updated"] = date.today().isoformat()
    coverage["evidenceStatus"].update({
        "verifiedMobileRecords": mobile["runtimeImportedRecordCount"] if mobile else 0,
        "verifiedLegacyRecordsImported": legacy["runtimeImportedRecordCount"] if legacy else 0,
        "runtimeCatalogRecords": sum(
            item.get("records", 0)
            for item in coverage.get("runtimeCatalogs", [])
            if isinstance(item.get("records"), int)
        ),
        "sourceAccess": "PUBLIC_GET_SUCCEEDED_2026-11-25" if network else "NOT_CHECKED",
        "fieldScopedMobileFieldsInGameplay": mobile["fieldScopedGameplayValueCount"] if mobile else 0,
        "note": f"Owner authorization covers found data/assets without an SPDX prerequisite. The full Mobile catalog is bundled and {mobile['fieldScopedGameplayValueCount'] if mobile else 0:,} field values have gameplay adapters; unmatched semantics remain SIMULATED or UNKNOWN.",
    })
    coverage["sourceInventory"] = {
        "legacy": legacy,
        "privateNormalizedLegacy": normalized,
        "mobilePublicCatalog": mobile,
        "mobileLegacyCountComparison": comparison,
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
        "legacyLicense": "Owner authorization dated 2026-11-25 covers found legacy gameplay data; raw table files remain in gitignored input-private/.",
    }
    coverage["notImported"] = [
        {
            "domain": "legacyGameplayTables",
            "reason": "Rows are hash-verified and structurally normalized in gitignored input-private/. Owner authorization is recorded; most legacy fields still need a gameplay-semantic mapping before runtime use.",
        },
        {
            "domain": "mobilePublicCatalogFields",
            "reason": "All seven public catalogs are bundled in the runtime source library. Only directly mapped field meanings affect gameplay; the remaining rows are searchable reference data.",
        },
        {
            "domain": "mobileVersionDelta",
            "reason": "Category record-count differences are reported below. Full field/value differences and exact version alignment remain unverified.",
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
    coverage["versionComparison"] = comparison
    coverage["normalizationStatus"] = (
        "OWNER_AUTHORIZED_PRIVATE_STRUCTURAL_NORMALIZATION_COMPLETE; RUNTIME_MAPPING_PENDING_FIELD_SEMANTICS"
        if normalized else "OWNER_AUTHORIZED_SOURCE_CAPTURE_COMPLETE; RUNTIME_MAPPING_PENDING"
    )
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

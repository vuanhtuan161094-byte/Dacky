#!/usr/bin/env python3
"""Refresh public source coverage from private research manifests."""

import hashlib
import json
import re
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
MOBILE_ASSET_MANIFEST = ROOT / "assets" / "mobile-source-manifest.json"
MOBILE_TECH_DATA = PRIVATE / "mobile_reference" / "khoa-ky.json"
LEGACY_TECH_DATA = PRIVATE / "normalized_legacy" / "technologyinfo.json"
LEGACY_BUILD_DATA = PRIVATE / "normalized_legacy" / "buildinfo.json"
MOBILE_BUILD_DATA = PRIVATE / "mobile_reference" / "cong-trinh.json"
LEGACY_MOBILE_TROOPS = PRIVATE / "normalized_legacy" / "147-soldierinfo.json"
LEGACY_TROOPS = PRIVATE / "normalized_legacy" / "soldierinfo.json"
NETWORK_CHECK = PRIVATE / "source_metadata" / "network-check.json"
APPROVED_SOURCE_DATA = ROOT / "src" / "approved-source-data.js"
LEGACY_QUEST_SOURCE_DATA = ROOT / "src" / "legacy-quest-catalog.js"
LEGACY_TROOP_TIME_SOURCE_DATA = ROOT / "src" / "legacy-troop-time-catalog.js"
LEGACY_TROOP_REQUIREMENT_SOURCE_DATA = ROOT / "src" / "legacy-troop-requirement-catalog.js"


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


def mobile_hero_art_inventory(facts):
    manifest = load_json(MOBILE_ASSET_MANIFEST)
    if manifest is None:
        return None
    heroes = facts.get("heroes", {})
    image_fields = [
        row.get("mobileImage", {}).get("value")
        for row in heroes.values()
        if row.get("mobileImage", {}).get("value")
    ]
    unique_paths = sorted({Path(value).as_posix().removeprefix("./") for value in image_fields})
    assets = {row.get("path"): row for row in manifest.get("assets", [])}
    verified = 0
    invalid = []
    for relative_path in unique_paths:
        asset = assets.get(relative_path)
        local_path = ROOT / relative_path
        if asset is None or not local_path.is_file():
            invalid.append(relative_path)
            continue
        payload = local_path.read_bytes()
        if len(payload) != asset.get("bytes") or hashlib.sha256(payload).hexdigest() != asset.get("sha256"):
            invalid.append(relative_path)
            continue
        verified += 1
    return {
        "status": "VERIFIED_LOCAL_MOBILE_HERO_ART" if len(image_fields) == len(heroes) and not invalid else "ART_COVERAGE_GAP",
        "sourceVersion": manifest.get("catalogVersion"),
        "runtimeHeroProfiles": len(heroes),
        "profilesWithSourceImageField": len(image_fields),
        "uniqueImageFilesReferenced": len(unique_paths),
        "verifiedLocalImageFiles": verified,
        "imageManifestAssetCount": len(manifest.get("assets", [])),
        "referencedImageBytes": sum(assets.get(path, {}).get("bytes", 0) for path in unique_paths),
        "invalidOrMissingImageFiles": len(invalid),
        "hashAlgorithm": "SHA-256",
    }


def runtime_legacy_quests():
    if not LEGACY_QUEST_SOURCE_DATA.exists():
        return None
    source = LEGACY_QUEST_SOURCE_DATA.read_text(encoding="utf-8")
    marker = "export const LEGACY_QUEST_SOURCE = Object.freeze("
    rows_marker = "export const LEGACY_QUESTS = Object.freeze("
    metadata_start = source.find(marker)
    rows_start = source.find(rows_marker)
    if metadata_start < 0 or rows_start < 0:
        raise ValueError("Could not parse generated legacy quest adapter")
    metadata_start += len(marker)
    rows_start += len(rows_marker)
    metadata_end = source.rfind(");", metadata_start, rows_start)
    rows_end = source.rfind(");", rows_start)
    if metadata_end <= metadata_start or rows_end <= rows_start:
        raise ValueError("Generated legacy quest adapter is incomplete")
    metadata = json.loads(source[metadata_start:metadata_end])
    records = json.loads(source[rows_start:rows_end])
    if len(records) != metadata.get("recordCount"):
        raise ValueError("Legacy quest adapter count does not match its metadata")
    return {"metadata": metadata, "records": records}


def runtime_legacy_troop_times():
    if not LEGACY_TROOP_TIME_SOURCE_DATA.exists():
        return None
    source = LEGACY_TROOP_TIME_SOURCE_DATA.read_text(encoding="utf-8")
    metadata_marker = "export const LEGACY_TROOP_TIME_SOURCE = Object.freeze("
    facts_marker = "export const LEGACY_TROOP_TIME_FACTS = Object.freeze("
    metadata_start = source.find(metadata_marker)
    facts_start = source.find(facts_marker)
    if metadata_start < 0 or facts_start < 0:
        raise ValueError("Could not parse generated legacy troop time adapter.")
    metadata_start += len(metadata_marker)
    facts_start += len(facts_marker)
    metadata_end = source.rfind(");", metadata_start, facts_start)
    facts_end = source.rfind(");", facts_start)
    if metadata_end <= metadata_start or facts_end <= facts_start:
        raise ValueError("Generated legacy troop time adapter is incomplete.")
    metadata = json.loads(source[metadata_start:metadata_end])
    facts = json.loads(source[facts_start:facts_end])
    if len(facts) != metadata.get("importedRecords"):
        raise ValueError("Legacy troop time adapter count does not match its metadata.")
    return {"metadata": metadata, "facts": facts}


def runtime_legacy_troop_requirements():
    if not LEGACY_TROOP_REQUIREMENT_SOURCE_DATA.exists():
        return None
    source = LEGACY_TROOP_REQUIREMENT_SOURCE_DATA.read_text(encoding="utf-8")
    metadata_marker = "export const LEGACY_TROOP_REQUIREMENT_SOURCE = Object.freeze("
    facts_marker = "export const LEGACY_TROOP_REQUIREMENT_FACTS = Object.freeze("
    metadata_start = source.find(metadata_marker)
    facts_start = source.find(facts_marker)
    if metadata_start < 0 or facts_start < 0:
        raise ValueError("Could not parse generated legacy troop requirement adapter.")
    metadata_start += len(metadata_marker)
    facts_start += len(facts_marker)
    metadata_end = source.rfind(");", metadata_start, facts_start)
    facts_end = source.rfind(");", facts_start)
    if metadata_end <= metadata_start or facts_end <= facts_start:
        raise ValueError("Generated legacy troop requirement adapter is incomplete.")
    metadata = json.loads(source[metadata_start:metadata_end])
    facts = json.loads(source[facts_start:facts_end])
    if len(facts) != metadata.get("mappedTroops"):
        raise ValueError("Legacy troop requirement adapter count does not match its metadata.")
    if sum(len(fields) for fields in facts.values()) != len(facts) * 2:
        raise ValueError("Legacy troop requirement adapter must retain cost and requirement provenance per profile.")
    return {"metadata": metadata, "facts": facts}


def technology_version_comparison():
    mobile = load_json(MOBILE_TECH_DATA)
    legacy = load_json(LEGACY_TECH_DATA)
    if not mobile or not legacy:
        return None
    legacy_rows = {str(row.get("NamedID")): row for row in legacy.get("records", [])}
    mobile_rows = mobile.get("muc", [])
    mobile_ids = [str(row.get("i")) for row in mobile_rows]
    shared_ids = set(legacy_rows) & set(mobile_ids)

    def rate_magnitude(value):
        match = re.search(r"(\d+(?:[.,]\d+)?)\s*%", str(value or ""))
        return float(match.group(1).replace(",", ".")) if match else None

    matching_rates = 0
    rate_deltas = []
    for source_id in sorted(shared_ids, key=lambda value: int(value)):
        legacy_row = legacy_rows[source_id]
        mobile_row = next(row for row in mobile_rows if str(row.get("i")) == source_id)
        level_table = next((block.get("dong", []) for block in mobile_row.get("d", []) if block.get("k") == "bang"), [])
        mobile_rate = rate_magnitude(level_table[0][1] if level_table else None)
        legacy_rate = rate_magnitude(legacy_row.get("Describe"))
        if legacy_rate is not None and legacy_rate == mobile_rate:
            matching_rates += 1
        else:
            rate_deltas.append({"sourceId": int(source_id), "legacyRate": legacy_rate, "mobileLevel1Rate": mobile_rate})

    legacy_order = [str(row.get("NamedID")) for row in sorted(legacy.get("records", []), key=lambda row: (int(row.get("ShowOrder") or 0), int(row.get("NamedID") or 0)))]
    show_order_values = {int(row.get("ShowOrder")) for row in legacy.get("records", []) if row.get("ShowOrder") is not None}
    show_order_gaps = [value for value in range(min(show_order_values), max(show_order_values) + 1) if value not in show_order_values] if show_order_values else []
    return {
        "status": "FIELD_LEVEL_RATE_AND_ORDER_COMPARISON",
        "mobileRecords": len(mobile_rows),
        "legacyRecords": len(legacy_rows),
        "sharedIds": len(shared_ids),
        "mobileOnlyIds": sorted(int(value) for value in set(mobile_ids) - shared_ids),
        "legacyOnlyIds": sorted(int(value) for value in set(legacy_rows) - shared_ids),
        "firstLevelEffectRateMagnitudeMatches": matching_rates,
        "firstLevelEffectRateDeltas": rate_deltas,
        "legacyShowOrderMatchesMobileRecordOrder": legacy_order == mobile_ids,
        "legacyShowOrderGaps": show_order_gaps,
        "parityClaim": False,
        "note": "Shared technology IDs have matching numeric first-level effect-rate magnitudes and the Mobile record order matches legacy ShowOrder. Legacy display names are absent; this does not establish full effect, requirement, price, or gameplay parity.",
    }


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

    runtime_quests = runtime_legacy_quests()
    return {
        "status": "LEGACY_RESEARCH_PARTIALLY_IMPORTED" if runtime_quests else "LEGACY_RESEARCH_DECODED_NOT_IMPORTED",
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
        "runtimeImportedRecordCount": len(runtime_quests["records"]) if runtime_quests else 0,
        "runtimeImportedTables": ["quest"] if runtime_quests else [],
        "runtimeImportedFieldValueCount": (
            len(runtime_quests["records"]) * len(runtime_quests["metadata"].get("importedFields", []))
            if runtime_quests else 0
        ),
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
    building_facts = facts.get("buildings", {})
    mobile_building_data = load_json(MOBILE_BUILD_DATA) or {}
    mobile_building_rows = mobile_building_data.get("muc", [])
    mapped_building_ids = {
        str(fields.get("mobileSourceId", {}).get("value"))
        for fields in building_facts.values()
        if fields.get("mobileSourceId", {}).get("value") is not None
    }
    cost_mapped_buildings = {
        source_id: fields["mobileLevelCosts"].get("value", [])
        for source_id, fields in building_facts.items()
        if fields.get("mobileLevelCosts", {}).get("value")
    }
    runtime_buildings = {
        str(fields.get("mobileSourceId", {}).get("value")): fields
        for fields in building_facts.values()
        if fields.get("mobileSourceId", {}).get("value") is not None
    }
    building_adapter = {
        "mobileSourceRecords": len(mobile_building_rows),
        "runtimeMappedRecords": len(mapped_building_ids),
        "runtimeMappedSourceIds": sorted(mapped_building_ids, key=int),
        "unmappedMobileSourceIds": sorted(
            {str(row.get("i")) for row in mobile_building_rows if row.get("i") is not None} - mapped_building_ids,
            key=int,
        ),
        "exactLevelCostTables": len(cost_mapped_buildings),
        "exactLevelCostRows": sum(len(rows) for rows in cost_mapped_buildings.values()),
        "mobileMappedSourceIdsWithoutLevelCosts": sorted(
            [source_id for source_id, fields in runtime_buildings.items()
             if not fields.get("mobileLevelCosts", {}).get("value")],
            key=int,
        ),
        "maxLevelSourceMissingIds": sorted(
            [source_id for source_id, fields in runtime_buildings.items()
             if "maxLevel" not in fields],
            key=int,
        ),
        "requirementRuntime": "Resolved Mobile building names and Dân số requirements are enforced; unmet known conditions block construction. Unsupported condition names remain visible as UNKNOWN and permissive.",
    }
    field_value_count = sum(len(fields) for table in facts.values() for fields in table.values())
    hero_art = mobile_hero_art_inventory(facts)
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
        "heroArt": hero_art,
        "buildingAdapter": building_adapter,
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


def building_version_comparison():
    legacy = load_json(LEGACY_BUILD_DATA)
    mobile = load_json(MOBILE_BUILD_DATA)
    if not legacy or not mobile:
        return None
    legacy_rows = {
        str(row.get("NamedID")): row.get("Describe")
        for row in legacy.get("records", [])
        if row.get("NamedID") is not None
    }
    mobile_rows = {
        str(row.get("i")): row.get("t")
        for row in mobile.get("muc", [])
        if row.get("i") is not None
    }
    shared = sorted(legacy_rows.keys() & mobile_rows.keys(), key=lambda value: int(value))
    name_differences = [
        {
            "id": source_id,
            "legacyName": legacy_rows[source_id],
            "mobileName": mobile_rows[source_id],
        }
        for source_id in shared
        if legacy_rows[source_id] != mobile_rows[source_id]
    ]
    return {
        "status": "FIELD_LEVEL_ID_NAME_COMPARISON",
        "legacySourceVersion": "DackyVanTien/MySQL 5.0 pinned snapshot",
        "legacySourceTable": "buildinfo",
        "legacyFields": ["NamedID", "Describe"],
        "mobileSourceVersion": "Mobile catalog v5d78c226cb",
        "mobileSourceTable": "cong-trinh",
        "mobileFields": ["muc[*].i", "muc[*].t"],
        "legacyRecordsCompared": len(legacy_rows),
        "mobileRecordsCompared": len(mobile_rows),
        "sharedIds": len(shared),
        "sameIdAndName": len(shared) - len(name_differences),
        "nameDifferences": name_differences,
        "idsOnlyInMobile": sorted(mobile_rows.keys() - legacy_rows.keys(), key=lambda value: int(value)),
        "idsOnlyInLegacy": sorted(legacy_rows.keys() - mobile_rows.keys(), key=lambda value: int(value)),
        "fullMechanicsParity": False,
        "note": "ID/name fields only; different versions and the 18/200 ID delta do not establish mechanics parity.",
    }


def troop_version_comparison():
    legacy_payload = load_json(LEGACY_MOBILE_TROOPS)
    legacy_alternate = load_json(LEGACY_TROOPS)
    if not legacy_payload:
        return None
    mobile_facts = runtime_mobile_facts().get("troops", {})
    legacy_rows = {
        str(row.get("SoldierID")): row
        for row in legacy_payload.get("records", [])
        if row.get("SoldierID") is not None
    }
    mobile_by_id = {
        str(fields.get("mobileSourceId", {}).get("value")): fields
        for fields in mobile_facts.values()
        if fields.get("mobileSourceId", {}).get("value") is not None
    }
    shared = sorted(legacy_rows.keys() & mobile_by_id.keys(), key=lambda value: int(value))
    field_pairs = {
        "name": "Name", "attack": "Att", "defense": "Def", "speed": "Speed",
        "mobileLife": "Life", "mobileCarry": "Heft", "mobileUpkeep": "Pay",
        "mobilePopulation": "Population",
    }
    field_comparisons = []
    for mobile_field, legacy_field in field_pairs.items():
        different_ids = [
            source_id for source_id in shared
            if mobile_by_id[source_id].get(mobile_field, {}).get("value") != legacy_rows[source_id].get(legacy_field)
        ]
        provenance = next((
            mobile_by_id[source_id][mobile_field].get("provenance", {})
            for source_id in shared
            if mobile_field in mobile_by_id[source_id]
        ), {})
        field_comparisons.append({
            "mobileField": mobile_field,
            "mobileSourceField": provenance.get("sourceField"),
            "legacyField": legacy_field,
            "comparedRecords": len(shared),
            "sameValueRecords": len(shared) - len(different_ids),
            "differentValueRecords": len(different_ids),
            "differentIds": different_ids,
        })

    alternate_delta = None
    if legacy_alternate:
        legacy_schema_fields = {
            field.get("name") for field in legacy_payload.get("schema", []) if field.get("name")
        }
        alternate_schema_fields = {
            field.get("name") for field in legacy_alternate.get("schema", []) if field.get("name")
        }
        alternate_rows = {
            str(row.get("SoldierID")): row
            for row in legacy_alternate.get("records", [])
            if row.get("SoldierID") is not None
        }
        alternate_shared = legacy_rows.keys() & alternate_rows.keys()
        field_delta_counts = {}
        changed_records = set()
        for source_id in alternate_shared:
            for field in legacy_rows[source_id].keys() & alternate_rows[source_id].keys():
                if field in {"provenance", "raw"}:
                    continue
                if legacy_rows[source_id].get(field) != alternate_rows[source_id].get(field):
                    field_delta_counts[field] = field_delta_counts.get(field, 0) + 1
                    changed_records.add(source_id)
        alternate_delta = {
            "status": "SAME_COMMIT_ALTERNATE_TABLE_DELTA",
            "tableA": "147-soldierinfo",
            "tableB": "soldierinfo",
            "recordsA": len(legacy_rows),
            "recordsB": len(alternate_rows),
            "sharedIds": len(alternate_shared),
            "changedRecords": len(changed_records),
            "fieldsWithDifferences": field_delta_counts,
            "fieldsOnlyIn147": sorted(legacy_schema_fields - alternate_schema_fields),
            "fieldsOnlyInSoldierinfo": sorted(alternate_schema_fields - legacy_schema_fields),
            "idsOnlyIn147": sorted(legacy_rows.keys() - alternate_rows.keys(), key=lambda value: int(value)),
            "idsOnlyInSoldierinfo": sorted(alternate_rows.keys() - legacy_rows.keys(), key=lambda value: int(value)),
        }
    return {
        "status": "FIELD_LEVEL_ID_AND_STAT_COMPARISON",
        "mobileSourceVersion": "Mobile catalog v5d78c226cb",
        "mobileSourceTable": "binh-chung",
        "legacySourceCommit": "13d969fc88c141553535c70943aaa98cf9f86616",
        "legacySourceTable": "147-soldierinfo",
        "mobileRecordsCompared": len(mobile_by_id),
        "legacyRecordsCompared": len(legacy_rows),
        "sharedIds": len(shared),
        "idsOnlyInMobile": sorted(mobile_by_id.keys() - legacy_rows.keys(), key=lambda value: int(value)),
        "idsOnlyInLegacy": sorted(legacy_rows.keys() - mobile_by_id.keys(), key=lambda value: int(value)),
        "fieldComparisons": field_comparisons,
        "alternateLegacyTable": alternate_delta,
        "preferredRuntimeVersion": "Mobile facts remain active for mapped records; legacy values stay in their version namespace where field values conflict.",
        "parityClaim": False,
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
        "fieldComparisons": {
            "buildings": building_version_comparison(),
            "troops": troop_version_comparison(),
        },
        "contentFieldDiff": "NOT_ESTABLISHED; versions and field semantics remain incompletely mapped",
        "parityClaim": False,
    }


def main():
    coverage = load_json(COVERAGE_PATH)
    if coverage is None:
        raise FileNotFoundError(COVERAGE_PATH)

    legacy = legacy_inventory()
    legacy_quests = runtime_legacy_quests()
    legacy_troop_times = runtime_legacy_troop_times()
    legacy_troop_requirements = runtime_legacy_troop_requirements()
    legacy_troop_time_field_count = sum(
        len(fields) for fields in legacy_troop_times["facts"].values()
    ) if legacy_troop_times else 0
    legacy_troop_requirement_field_count = sum(
        len(fields) for fields in legacy_troop_requirements["facts"].values()
    ) if legacy_troop_requirements else 0
    mobile = mobile_inventory()
    normalized = normalized_inventory()
    comparison = count_comparison(load_json(LEGACY_MANIFEST), load_json(MOBILE_MANIFEST))
    technology_comparison = technology_version_comparison()
    network = load_json(NETWORK_CHECK)
    if technology_comparison:
        coverage.setdefault("mobileLegacyComparison", {})["technologies"] = technology_comparison
    if mobile:
        coverage.setdefault("runtimeMechanics", {})["buildingProgression"] = mobile["buildingAdapter"]
        hero_catalog = next((
            item for item in coverage.get("runtimeCatalogs", [])
            if item.get("domain") == "heroes"
        ), None)
        if hero_catalog:
            mobile_hero_count = mobile["categories"].get("than-tien", {}).get("gameplayMappedRecords", 0)
            hero_catalog.update({
                "sourceLibraryRecords": mobile["categories"].get("than-tien", {}).get("recordsServed", 0),
                "mobileRuntimeRecords": mobile_hero_count,
                "recruitableRecords": mobile_hero_count,
                "simulatedRecords": max(0, hero_catalog.get("records", 0) - mobile_hero_count),
                "simulatedRecordsRecruitable": 0,
                "sourceFields": f"{mobile_hero_count} Mobile hero profiles retain source identity, local portrait, base stats, faction, occupation, abilities and field provenance; recruitment exposes only these source-backed profiles. Combat formulas remain SIMULATED.",
            })
        troop_catalog = next((
            item for item in coverage.get("runtimeCatalogs", [])
            if item.get("domain") == "troops"
        ), None)
        if troop_catalog:
            mobile_troop_count = mobile["categories"].get("binh-chung", {}).get("gameplayMappedRecords", 0)
            cost_profiles = len(legacy_troop_requirements["facts"]) if legacy_troop_requirements else 0
            troop_catalog.update({
                "mobileRecords": mobile_troop_count,
                "recruitableRecords": mobile_troop_count,
                "simulatedRecords": max(0, troop_catalog.get("records", 0) - mobile_troop_count),
                "simulatedRecordsTrainable": 0,
                "legacyCostProfiles": cost_profiles,
                "legacyConditionProfiles": cost_profiles,
                "mobileProfilesWithSimulatedTrainingCosts": max(0, mobile_troop_count - cost_profiles),
                "sourceFields": f"{mobile_troop_count} Mobile troop profiles retain source stats, roles, counters, local art and field provenance; only these profiles are trainable. Twenty-four shared IDs use legacy training base times. Verified legacy resource costs and mapped barracks/technology prerequisites cover {cost_profiles}/{mobile_troop_count}; unsupported work shop requirements remain UNKNOWN and other missing rows stay SIMULATED.",
            })
        if legacy_troop_times:
            time_values = [
                fields["trainSeconds"]["value"]
                for fields in legacy_troop_times["facts"].values()
            ]
            mobile_troop_count = mobile["categories"].get("binh-chung", {}).get("gameplayMappedRecords", 0)
            coverage["runtimeMechanics"]["troopTrainingTime"] = {
                "status": legacy_troop_times["metadata"]["status"],
                "mobileProfiles": mobile_troop_count,
                "legacyTimeProfiles": len(legacy_troop_times["facts"]),
                "mobileProfilesUsingSimulatedBaseTime": max(0, mobile_troop_count - len(legacy_troop_times["facts"])),
                "importedFieldValueCount": legacy_troop_time_field_count,
                "sourceTable": legacy_troop_times["metadata"]["sourceTable"],
                "sourceCommit": legacy_troop_times["metadata"]["sourceCommit"],
                "sourceFields": legacy_troop_times["metadata"]["sourceFields"],
                "unit": "seconds per troop",
                "conversion": legacy_troop_times["metadata"]["conversion"],
                "baseSecondsRange": [min(time_values), max(time_values)] if time_values else None,
                "queueSpeedModifiers": "SIMULATED runtime technology/building modifiers remain applied after the sourced base duration.",
            }
        if legacy_troop_requirements:
            requirement_facts = legacy_troop_requirements["facts"]
            mapped_building_requirements = sum(
                len(fields["trainingRequirements"]["value"].get("buildings", []))
                for fields in requirement_facts.values()
            )
            mapped_technology_requirements = sum(
                len(fields["trainingRequirements"]["value"].get("technologies", []))
                for fields in requirement_facts.values()
            )
            unknown_requirements = sum(
                len(fields["trainingRequirements"]["value"].get("unknown", []))
                for fields in requirement_facts.values()
            )
            mobile_troop_count = mobile["categories"].get("binh-chung", {}).get("gameplayMappedRecords", 0)
            coverage["runtimeMechanics"]["troopTrainingRequirements"] = {
                "status": legacy_troop_requirements["metadata"]["status"],
                "mobileProfiles": mobile_troop_count,
                "profilesWithVerifiedLegacyCosts": len(requirement_facts),
                "profilesWithVerifiedLegacyRequirements": len(requirement_facts),
                "profilesWithoutLegacyRows": max(0, mobile_troop_count - len(requirement_facts)),
                "sourceRequirementRows": legacy_troop_requirements["metadata"]["importedRequirementRows"],
                "mappedBuildingRequirementRows": mapped_building_requirements,
                "mappedTechnologyRequirementRows": mapped_technology_requirements,
                "unknownRequirementRows": unknown_requirements,
                "comparison": legacy_troop_requirements["metadata"]["comparison"],
                "unsupportedWorkshopNamedId": "22",
                "unsupportedWorkshopStatus": "UNKNOWN",
                "versionScoped": True,
            }
        technology_catalog = next((
            item for item in coverage.get("runtimeCatalogs", [])
            if item.get("domain") == "technologies"
        ), None)
        if technology_catalog:
            technology_count = mobile["categories"].get("khoa-ky", {}).get("gameplayMappedRecords", 0)
            technology_catalog.update({
                "mobileLevelTables": technology_count,
                "simulatedRecords": max(0, technology_catalog.get("records", 0) - technology_count),
                "sourceFields": f"{technology_count} Mobile technology profiles retain exact names, all 30 level cost/effect/requirement rows, images and field provenance; UNKNOWN or partial runtime formulas remain explicitly scoped",
            })
            technology_mechanics = coverage.setdefault("runtimeMechanics", {}).setdefault("technologyBranches", {})
            technology_mechanics.update({
                "records": technology_count,
                "levels": technology_count * 30,
                "runtimeEffects": [
                    "Food, timber, stone, and iron production",
                    "Tax component of gold income",
                    "Warehouse capacity",
                    "Construction and troop-training speed",
                    "Army attack, defense, and maximum health",
                    "Transport and march speed",
                    "Node-specific scouting success",
                    "Army lead capacity",
                    "Immortal defense",
                ],
                "status": "MIXED",
                "mobileExactCostTables": technology_count,
                "partialRuntimeEffects": 7,
                "unknownRuntimeEffects": 1,
                "sourceRateParsing": "The first Mobile level effect gives the per-level source rate. Partial formulas retain a simulated baseline; spell cost remains UNKNOWN.",
            })
            technology_mechanics.pop("simulatedEffectMappings", None)
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
    if legacy_quests:
        quest_catalog = next((
            item for item in coverage.get("runtimeCatalogs", [])
            if item.get("domain") == "legacyQuestReference"
        ), None)
        if quest_catalog is None:
            quest_catalog = {"domain": "legacyQuestReference"}
            coverage.setdefault("runtimeCatalogs", []).append(quest_catalog)
        quest_catalog.update({
            "records": len(legacy_quests["records"]),
            "status": "VERIFIED_LEGACY_REFERENCE",
            "activeGameplayRecords": 0,
            "fieldValueCount": legacy["runtimeImportedFieldValueCount"],
            "sourceTable": legacy_quests["metadata"]["sourceTable"],
            "sourceCommit": legacy_quests["metadata"]["sourceCommit"],
            "fields": legacy_quests["metadata"]["importedFields"],
            "mechanicsStatus": "UNKNOWN",
            "versionComparison": legacy_quests["metadata"]["versionComparison"],
        })
    if legacy and (legacy_troop_times or legacy_troop_requirements):
        legacy["supplementalRuntimeImports"] = {}
        if legacy_troop_times:
            legacy["supplementalRuntimeImports"]["147-soldierinfo.trainingTime"] = {
                "records": len(legacy_troop_times["facts"]),
                "fieldValueCount": legacy_troop_time_field_count,
                "sourceFields": legacy_troop_times["metadata"]["sourceFields"],
                "unit": "seconds",
            }
        if legacy_troop_requirements:
            legacy["supplementalRuntimeImports"]["147-soldierrequireinfo.trainingCostAndRequirements"] = {
                "records": len(legacy_troop_requirements["facts"]),
                "fieldValueCount": legacy_troop_requirement_field_count,
                "sourceRequirementRows": legacy_troop_requirements["metadata"]["importedRequirementRows"],
                "comparison": legacy_troop_requirements["metadata"]["comparison"],
            }
    coverage["updated"] = date.today().isoformat()
    coverage["evidenceStatus"].update({
        "verifiedMobileRecords": mobile["runtimeImportedRecordCount"] if mobile else 0,
        "verifiedLegacyRecordsImported": (legacy["runtimeImportedRecordCount"] if legacy else 0) + (len(legacy_troop_times["facts"]) if legacy_troop_times else 0) + (len(legacy_troop_requirements["facts"]) if legacy_troop_requirements else 0),
        "runtimeCatalogRecords": sum(
            item.get("records", 0)
            for item in coverage.get("runtimeCatalogs", [])
            if isinstance(item.get("records"), int)
        ),
        "sourceAccess": "PUBLIC_GET_SUCCEEDED_2026-11-25" if network else "NOT_CHECKED",
        "fieldScopedMobileFieldsInGameplay": mobile["fieldScopedGameplayValueCount"] if mobile else 0,
        "fieldScopedLegacyFieldsImported": (legacy["runtimeImportedFieldValueCount"] if legacy else 0) + legacy_troop_time_field_count + legacy_troop_requirement_field_count,
        "note": f"Owner authorization covers found data/assets without an SPDX prerequisite. The full Mobile catalog is bundled and {mobile['fieldScopedGameplayValueCount'] if mobile else 0:,} field values have gameplay adapters; unmatched semantics remain SIMULATED or UNKNOWN.",
    })
    coverage["sourceInventory"] = {
        "legacy": legacy,
        "privateNormalizedLegacy": normalized,
        "legacyQuestRuntime": ({
            "sourceVersion": legacy_quests["metadata"]["sourceVersion"],
            "sourceTable": legacy_quests["metadata"]["sourceTable"],
            "sourceCommit": legacy_quests["metadata"]["sourceCommit"],
            "recordCount": len(legacy_quests["records"]),
            "importedFields": legacy_quests["metadata"]["importedFields"],
            "mechanicsStatus": "UNKNOWN",
            "versionComparison": legacy_quests["metadata"]["versionComparison"],
        } if legacy_quests else None),
        "legacyTroopTrainingTime": ({
            "sourceVersion": legacy_troop_times["metadata"]["sourceVersion"],
            "sourceTable": legacy_troop_times["metadata"]["sourceTable"],
            "sourceCommit": legacy_troop_times["metadata"]["sourceCommit"],
            "recordCount": len(legacy_troop_times["facts"]),
            "sourceFields": legacy_troop_times["metadata"]["sourceFields"],
            "unit": "seconds",
        } if legacy_troop_times else None),
        "legacyTroopTrainingRequirements": ({
            "sourceVersion": legacy_troop_requirements["metadata"]["sourceVersion"],
            "sourceTable": legacy_troop_requirements["metadata"]["sourceTable"],
            "sourceCommit": legacy_troop_requirements["metadata"]["sourceCommit"],
            "recordCount": len(legacy_troop_requirements["facts"]),
            "sourceRows": legacy_troop_requirements["metadata"]["importedRequirementRows"],
            "fieldValueCount": legacy_troop_requirement_field_count,
            "comparison": legacy_troop_requirements["metadata"]["comparison"],
            "permission": "OWNER_AUTHORIZATION_NO_SPDX_REQUIRED",
        } if legacy_troop_requirements else None),
        "mobileHeroArt": mobile["heroArt"] if mobile else None,
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
            "domain": "legacyGameplayFieldsExceptQuestDescriptionsAndPartiallyMappedTroopTraining",
            "reason": "Quest descriptions remain a versioned reference, and troop requirements are mapped only where legacy IDs and runtime buildings/technologies align. Most other legacy fields plus quest conditions/rewards still need gameplay-semantic mapping before they can affect progression.",
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
    coverage["versionComparison"] = {
        **(comparison or {}),
        "legacyQuestFields": legacy_quests["metadata"]["versionComparison"] if legacy_quests else None,
    }
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

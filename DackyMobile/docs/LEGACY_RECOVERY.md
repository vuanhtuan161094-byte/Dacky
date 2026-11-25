# Recover legacy research without depending on Codex network access

The 2026-11-24 403 was transient. On 2026-11-25 normal HTTPS GETs to the public Mobile site, public catalog JSON, GitHub raw/API and npm succeeded. The public PTC catalog was captured at version `5d78c226cb` (7 catalogs, 2,656 rows); the original Mobile client version and full gameplay delta remain unknown. At pinned legacy commit `13d969fc88c141553535c70943aaa98cf9f86616`, 208 allowlisted files were SHA-verified; 67/70 tables decode to 161,331 rows and three remain HOLD. All decoded tables have private structural normalization and per-field hashes. Raw inputs stay gitignored. Do not change network security controls, bypass a server's restrictions or retry repeatedly.

## Preferred: local cache on an authorized machine

From DackyMobile, run on an authorized machine where public GitHub access is permitted:

    python scripts/extract_a1.py --fetch
    python scripts/normalize_legacy_research.py

Default source and output are input-private/legacy_table_cache and input-private/extracted. If Codex itself has no network, run the acquisition in the normal terminal first and make the resulting ignored input-private folder available to Codex local. Check manifest.json for actual DECODED/HOLD per table. No old binary or server execution.

## Offline alternative: restored research

A2 staging Drive contains nine raw-source documents (B01-1, B01-2, B02–B08), with 114 unique file entries across 38 tables: 90 uncompressed Base64 entries and 24 compressed entries. The normalized famousgeneraliteminfo document contains 540 rows and 20 columns, historical data only. Export the documents as plain text into input-private/a2-exports/; ensure B01-2 (outside the original folder) is included. Run:

    python scripts/restore_a2.py
    python scripts/extract_a1.py

The offline restorer validates the pinned source, size (when supplied) and Git blob SHA before writing any uncompressed cache file. Compressed entries with undocumented encoding stay HOLD; acquire those files from pinned public source when permitted. The normalized roster remains separate from runtime. The previous A1 snapshot can also be supplied under input-private/legacy_a1_snapshot.json. Do not commit any input-private files, raw dumps, credentials, account records or proprietary extracted data.

`normalize_legacy_research.py` writes only to `input-private/normalized_legacy/`. It rechecks each `.frm`, `.MYI`, and `.MYD` Git blob hash, row/schema shape, and records source commit/table/field hashes. It intentionally marks semantics and nullability UNKNOWN and does not grant runtime or redistribution permission. `DATA_COVERAGE.json` includes row-count-only category comparisons; those are not identity or parity results.

## Next Codex task

1. Use the existing `/workspace/Dacky` checkout and private inputs. Check actual manifest counts; do not equate staged files with imported runtime rows.
2. Map independently verified gameplay facts from the historical source into runtime with version and field provenance, preserve original IDs where permitted, handle missing semantics explicitly and keep Mobile differences separate. Use a versioned save migration.
3. Replace simulations incrementally only where evidence supports replacement; prioritize buildings/tech, soldier requirements/counters, hero roster, equipment and quests. For files still unavailable, continue with clearly labeled simulations.
4. Run engine tests, build Web/Android, update DATA_COVERAGE and PROGRESS; do not claim Mobile parity or license clearance without evidence.
5. Keep research inputs private; publish only permitted code and independently normalized facts. Do not merge or alter other game directories.

Network troubleshooting: test a normal approved terminal with curl -I against the public source URL. If the approved terminal works but Codex fails, check Codex environment network settings/allowlist or ask the administrator to permit required public domains. If both return 403, use offline inputs or obtain authorized access; do not evade the block.

#!/usr/bin/env python3
"""Verify cached allowlisted MyISAM files against the pinned Git tree metadata."""

import hashlib
import json
from pathlib import Path

from extract_a1 import COMMIT, TABLES


ROOT = Path(__file__).resolve().parents[1]
PRIVATE = ROOT / "input-private"
TREE_PATH = PRIVATE / "source_metadata" / "legacy-tree.json"
CACHE_DIR = PRIVATE / "legacy_table_cache"
SOURCE_PREFIX = "Server/MySQL_Server_5.0/data/fswd-main/"
ALLOWED_EXTENSIONS = ("frm", "MYI", "MYD")


def git_blob_sha(data):
    header = b"blob " + str(len(data)).encode("ascii") + bytes([0])
    return hashlib.sha1(header + data).hexdigest()


def verify_cache():
    tree = json.loads(TREE_PATH.read_text(encoding="utf-8"))
    if tree.get("sha") != COMMIT or tree.get("truncated"):
        raise ValueError("Pinned source tree metadata is missing, mismatched, or truncated.")

    entries = {
        entry["path"]: entry
        for entry in tree.get("tree", [])
        if entry.get("type") == "blob"
    }
    expected_paths = {
        SOURCE_PREFIX + table + "." + extension
        for table in TABLES
        for extension in ALLOWED_EXTENSIONS
    }
    allowed_paths = expected_paths & entries.keys()
    actual_paths = {
        SOURCE_PREFIX + path.name
        for path in CACHE_DIR.iterdir()
        if path.is_file()
    } if CACHE_DIR.exists() else set()

    unexpected = sorted(actual_paths - allowed_paths)
    missing = sorted(allowed_paths - actual_paths)
    mismatched = []
    verified = 0

    for source_path in sorted(actual_paths & allowed_paths):
        local_path = CACHE_DIR / source_path.removeprefix(SOURCE_PREFIX)
        actual_sha = git_blob_sha(local_path.read_bytes())
        expected_sha = entries[source_path].get("sha")
        if actual_sha != expected_sha:
            mismatched.append({
                "path": local_path.name,
                "expectedSha": expected_sha,
                "actualSha": actual_sha,
            })
        else:
            verified += 1

    return {
        "sourceCommit": COMMIT,
        "treeEntryCount": len(tree.get("tree", [])),
        "allowedFileCountInSource": len(allowed_paths),
        "cachedFileCount": len(actual_paths),
        "verifiedFileCount": verified,
        "missingCachedFiles": [Path(path).name for path in missing],
        "unexpectedFiles": [Path(path).name for path in unexpected],
        "mismatchedFiles": mismatched,
        "valid": not unexpected and not mismatched and verified == len(actual_paths),
    }


if __name__ == "__main__":
    result = verify_cache()
    print(json.dumps(result, ensure_ascii=False, indent=2))
    raise SystemExit(0 if result["valid"] else 1)

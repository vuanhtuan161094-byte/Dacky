# Blockers and open risks

| Area | Blocker / limitation | Evidence | Current handling |
| --- | --- | --- | --- |
| Data provenance | The 7 public Mobile catalogs are captured, but the original client version, complete Mobile/legacy delta and redistribution terms are unknown. | PTC catalog version `5d78c226cb`; no explicit game client version/license manifest on the public catalog page. | Runtime import count stays 0; catalogs and raw rows remain in gitignored `input-private/`. |
| Legacy parsing | 6 of 70 pinned tables remain `HOLD`. | `DATA_COVERAGE.json`: unknown packed block types 249/253, unsupported DATETIME layouts, and one source table absent at the pinned commit. | Keep unsupported tables isolated; do not infer binary layout. |
| Source license | GitHub reported no SPDX license for the pinned legacy repository; Mobile catalog has no source license field. | GitHub repo metadata and captured public catalog manifest. | Do not publish raw rows, descriptions or assets; no parity/reuse claim. |
| Android device QA | APK builds and its package/target SDK/signature are verified, but installation/runtime on a device is not. | No emulator installed; ADB cannot create `/home/agent/.android` in this read-only environment. | Report static APK verification only; do not mark Android device QA PASS. |
| Standalone offline HTML | Chromium does not open `dist/offline.html` using `file://`. | Previous offline smoke returned `chrome-error://chromewebdata/`; localhost PWA smoke passes. | Use PWA over localhost/HTTPS; standalone file mode remains unverified here. |

The 2026-11-24 public-source HTTP 403 is resolved for the tested public GET routes on 2026-11-25; see `DATA_COVERAGE.json`. No credentials, authenticated flow, private endpoint, server or legacy executable was used.

# Temple of Ma'at — Relationship Browser Adapter

_Last revised: 2026-08-15 · adapter v1.0.0_

The browser adapter is the next layer above the public Relationship Resolver. It supplies canonical browser-side record providers without changing graph semantics and without reading private visitor state.

The implementation lives at:

`./scripts/v5.3.0-relationship-browser-adapter.mjs`

It imports the shared resolver from:

`./scripts/v5.3.0-relationship-resolver.mjs`

## Architectural position

The intended stack is now:

`Knowledge Kernel → Relationship Graph → Resolver → Browser Providers → Comparative Reading → Research Workspace → Temple Map`

The adapter does not create edges, infer historical influence, or convert connectivity into causality. It simply allows a public graph endpoint such as `chamber:01` or `library:study.quran-abjad-gematria` to resolve to its corresponding canonical public record.

## Public provider namespaces

### Chamber

Primary browser source:

`window.TempleArchive.chambers()`

Fallback public source:

`./chambers.json`

The fallback makes Chamber resolution independent of private Journey state and usable by future research interfaces even when no chamber overlay is open.

### Codex

Public browser source:

`window.TempleLivingCodex.record(number)`

The provider resolves only the public Living Codex record. Journey favorites and reflections are not part of this namespace.

### Dossier

Public browser source:

`window.TempleShem72.record(number)`

The adapter identifies this specifically as the `shem-dossier-source-layer`. It does not pretend that the source-preserved Shem record is the whole assembled visitor-facing Dossier. The provider therefore carries a provenance note explaining that private Journey reflection state is excluded.

This distinction matters: the Dossier UI may visually bring together several public Temple layers, but graph resolution should not silently flatten them into one historical source object.

### Library

Public source:

`./library/catalog.json`

The provider searches the five catalog record arrays defined by the Library v1 schema:

- `traditions`;
- `sources`;
- `studies`;
- `discernments`;
- `correspondences`.

Rights and public-exposure metadata remain attached to resolved Library records.

## Privacy boundary

The adapter declares:

`privacy: public-canonical-only`

It does not read:

- Pilgrim Journey reflections;
- Journey favorites;
- private Library notes;
- bookmarks;
- localStorage;
- IndexedDB;
- device-local ritual-media state;
- named-pilgrimage private records.

As defense in depth, records returned by browser globals are sanitized for explicit private-state keys such as `reflection`, `reflections`, `favorite`, `favorites`, `bookmark`, `bookmarks`, `privateNote`, `privateNotes`, `localStorage`, `indexedDB`, and `deviceState` before they enter resolver output.

This sanitizer is not permission to pass arbitrary private objects into the adapter. Providers must still be sourced from canonical public systems.

## Installation

Future browser consumers may import and install the adapter explicitly:

```js
import { installTempleRelationshipBrowserAdapter } from './scripts/v5.3.0-relationship-browser-adapter.mjs';
const relationships = await installTempleRelationshipBrowserAdapter();
```

Installation publishes:

`window.TempleRelationshipBrowser`

and emits:

`temple:relationship-browser-ready`

The installation helper is idempotent.

This PR intentionally does not add automatic threshold wiring or a production UI. A future Comparative Reading interface should load the adapter deliberately and consume the same governed API.

## API surface

The browser API exposes:

- `resolve(endpoint)`;
- `resolveMany(endpoints)`;
- `neighbors(endpoint, filter)`;
- `between(left, right, filter)`;
- `search(query, filter)`;
- `shortestPath(start, end, options)`;
- `facetCounts(filter)`;
- `exportBundle(selection)`;
- `catalogs.chambers()`;
- `catalogs.library()`;
- `stats()`.

Graph-returning methods retain the resolver's existing provenance, confidence, direction, claim-boundary, evidence, and limitation fields.

## Connectivity warning

A browser interface must not render a path as a historical chain merely because records are connected.

For example:

`chamber:01 → codex:01 → dossier:01`

is a valid Temple structural path because the canonical graph contains those edges. It is not evidence that an ancient source historically transmitted through those three application records.

Comparative Reading should display the claim class, provenance layers, confidence, evidence basis, and limitations beside any relationship it shows.

## Caching

The adapter memoizes the public Chamber and Library catalog loads for its lifetime. It does not cache private state and does not write to browser storage.

## Next consumer

The next recommended consumer is a **Comparative Reading / Research Workspace** that can:

1. select two canonical endpoints;
2. resolve both public records;
3. show the exact relationship edge(s) between them;
4. expose provenance / evidence / limitations before interpretation;
5. preserve an explicit boundary between historical source, scholarship, later correspondence, Temple synthesis, and private visitor reflection.

The later Temple Map should consume the same resolver and adapter rather than implement separate relationship semantics.

# Living Temple Map v1

The **Living Temple Map** is the provenance-aware visual layer over the Temple's existing public Relationship Graph. It does not create relationships from visual proximity, shared numbers, similar names, spiritual intuition, or private visitor notes. It renders only canonical edges already stored in `research/relationship-graph.json` and exposes each edge's evidence, limitations, claim class, provenance layers, and historical/metaphysical boundaries.

Schema: `temple-of-maat/living-temple-map-v1`  
Version: `1.0.0`  
Privacy: `public-canonical-only`

## Place in the research architecture

`Knowledge Kernel → Relationship Graph → Resolver → Browser Adapter → Living Temple Map`

The map consumes the same resolver/browser-adapter contract used by Comparative Reading. It does not fork or reinterpret graph data. Selecting a record resolves it through the public providers for chamber, Living Codex, Shem dossier, or Library records. Selecting an edge shows the stored canonical relationship claim and its evidence rather than inventing a new correspondence.

## Provenance bands

The map adds a visual classification layer for navigation only. The original graph `relationType`, `claimBoundary.claimClass`, evidence basis, and L1–L4 provenance values remain visible and authoritative.

- **Source / Textual** — source-study dependency and explicit textual relationships.
- **Historical / Later Correspondence** — historical context/influence records and later historical correspondence claims when those are explicitly stored.
- **Computational** — numerical or algorithmic correspondence records.
- **Comparative** — methodological, thematic, or comparative-similarity records.
- **Temple Synthesis** — Temple structural alignment and explicit Temple correspondence records.
- **Unclassified** — an honest fallback for a stored edge that does not yet fit the visual bands. The map does not force it into a stronger category.

A provenance band is a display facet, not a replacement claim. For example, a `study-uses-source` edge can still carry a computational or comparative claim class; the detail panel shows both dimensions.

## Pair Authority overlay

For numeric `chamber`, `codex`, and `dossier` records, the detail panel may display the governed Pair Authority naming layer from:

- `research/pair-authority.json`
- `research/pair-authority-name-migration.v1.json`

The overlay explicitly distinguishes:

- the deployed **Amendment I** Third Name (`temple-third-name-v1`);
- the preferred future **Amendment II** refined form (`temple-third-name-refined-v2`);
- the current migration state.

This is provenance display only. The map does **not** rename the live chamber, change the angel–daemon pairing, rewrite gematria, or create a graph edge from the naming relationship. `implementationMigrated = false` remains visible until a separate explicit release performs that migration.

## Accessibility

The graphical constellation is supplemental. Every canonical edge is also represented in an **Accessible List** with the relationship band, claim class, relation type, endpoint names, and endpoint IDs. Record and edge controls are ordinary keyboard-focusable buttons, the dialog traps focus while open, Escape closes it, and claim boundaries are presented as text rather than color alone.

At widths of 700px and below, the workspace automatically uses the Accessible List. The visual map is not forced into a cramped mobile viewport. The 360px and 412px smoke tests enforce no horizontal overflow and verify that the list remains fully operable.

## Privacy boundary

Living Temple Map v1 deliberately reads **no** device-local Journey reflections, Library notes, Research Notebook entries, or Nabu–Thoth Scribe threads. It does not inspect browser private-state stores and performs no network writes. Canonical exports use the existing resolver's `public-canonical-only` relationship-bundle contract.

A future private overlay may show a local indication that a private thread is attached to a canonical record, but only if it is explicitly opted into. Such an overlay must remain device-local, must not expose private titles or bodies in a public export, and must never become Relationship Graph or Knowledge Kernel evidence.

## Staged activation

The module is intentionally **not auto-loaded** by `scripts/v5.3-threshold.js`. Importing and installing `scripts/v5.3.3-living-temple-map.mjs` is an explicit research action. Once installed, it may add a **Living Temple Map** launcher to the existing Library footer. It does not add a bottom-dock control or change the default visitor startup path.

Example explicit activation:

```js
const { installTempleLivingMap } = await import('./scripts/v5.3.3-living-temple-map.mjs');
await installTempleLivingMap();
```

## Public API

`window.TempleLivingTempleMap` exposes:

- `edges()` and `endpoints()` — clones of current public graph data;
- `bands()` — visual provenance-band labels;
- `filters()` / `setFilters()` — query, band, and L1–L4 filtering;
- `view()` / `setView()` — map or accessible-list mode, with mobile coercion to list;
- `open()` / `close()` — dialog lifecycle;
- `selectEndpoint()` / `selectEdge()` — canonical inspection;
- `pairAuthority(number)` — public Pair Authority naming overlay for a governed pair number;
- `exportVisible()` — resolver-generated public relationship bundle for the current filtered edge set.

## Governing interpretation rule

**A line means only that a stored edge exists. A path means only that stored edges connect. Neither visual geometry nor connectivity proves causality, historical transmission, metaphysical identity, spiritual rank, or revelation.**

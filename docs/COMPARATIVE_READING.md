# Temple of Ma'at — Comparative Reading / Research Workspace

_Last revised: 2026-08-15 · Comparative Reading v1.0.0_

Comparative Reading is the first browser consumer of the governed relationship stack:

`Knowledge Kernel → Relationship Graph → Resolver → Browser Providers → Comparative Reading`

Its purpose is to let a visitor place two canonical public records beside the exact relationship evidence already stored in the public graph.

## Covenant

The interface begins from:

`Source → Scholarship → Correspondence → Temple Interpretation`

It does not silently move a claim upward in authority. It does not create a relationship because two records look similar, share a number, or feel symbolically related.

If no direct graph edge exists, the workspace says so.

If a stored connectivity path exists, the path is labeled:

**Connectivity only — not causality.**

## Records

The workspace obtains public records only through `window.TempleRelationshipBrowser`, which is backed by the shared resolver and canonical browser providers.

The initial graph exposes Chamber, Living Codex, Shem Dossier source-layer, and Library endpoints.

Each record card shows only fields already present in the public provider record, such as title/name, record kind, provenance layers, status, summary/office/attribute, rights exposure, or source kind.

Private Journey reflections, favorites, Library notes, bookmarks, pilgrimage records, and ritual-media state are not read into the workspace.

## Relationship evidence

For every direct edge, the workspace surfaces:

- relation type;
- direction;
- confidence;
- claim class;
- provenance layers;
- direct-historical-influence state;
- evidence basis;
- evidence note;
- source references;
- limitations;
- historical-identity flag;
- metaphysical-identity flag.

These fields remain those declared by `research/relationship-graph.json`. The workspace does not escalate them.

## No-direct-edge behavior

When two records have no direct stored relationship, the interface displays:

> No direct canonical relationship edge exists between these records. The workspace will not invent one.

A shortest connectivity path may then be shown if the resolver finds one. The UI explicitly states that a path does not prove historical transmission, causality, metaphysical identity, or source dependence.

## Library integration

When the module is explicitly installed, it adds **Comparative Reading** inside the existing Temple Library footer. It does not add another bottom-dock control.

The current PR intentionally does not auto-load the module from the threshold runtime. This keeps the feature staged behind an explicit module install while its evidence model and mobile interaction are validated.

## Accessibility

The workspace is a modal dialog with:

- labelled close controls;
- labelled Record A / Record B selectors;
- 44px+ interactive targets;
- Escape-to-close;
- focus trapping while open;
- focus return on close;
- responsive single-column reading below 760px.

## Privacy

Comparative Reading declares `privacy: public-canonical-only`.

It does not write to localStorage, IndexedDB, the Knowledge Kernel, the Relationship Graph, the Library catalog, or Journey state.

The public evidence view is intentionally separate from private visitor interpretation. A future consent-aware Research Workspace may allow the visitor to place private notes beside public evidence, but those notes must remain a local overlay and must never be silently exported as canonical graph evidence.

## Next step

After this evidence view is stable, the Research Workspace can add:

1. source passage inspection;
2. Knowledge Kernel claim inspection;
3. a private local notebook overlay;
4. explicit consent-aware research export;
5. multi-record reading sets;
6. eventually the Temple Map using the same governed relationship semantics.

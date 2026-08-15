# Knowledge Kernel Claim & Source Passage Inspector

The Knowledge Inspector is the next governed layer above Comparative Reading. It answers a specific research question:

> What canonical Knowledge Kernel evidence sits underneath this visible graph endpoint or relationship?

It does not create relationships, claims, correspondences, historical identities, or metaphysical identities.

## Position in the architecture

`Knowledge Kernel → Relationship Graph → Resolver → Browser Providers → Comparative Reading → Claim & Passage Inspection`

The graph answers **what public records are connected**. The Knowledge Kernel answers **what claims, source locators, methods, provenance classes, and limitations have actually been recorded**.

Those two layers must remain distinguishable.

## Reviewed endpoint map

`research/knowledge-kernel/endpoint-map.v1.json` is the explicit bridge between public graph endpoint IDs and Knowledge Kernel IDs.

A mapping is added only when its basis is reviewable. The inspector never guesses an identity from similar wording or subject matter.

The first reviewed mappings are:

- `chamber:01` → `chamber.01`
- `chamber:02` → `chamber.02`
- `chamber:03` → `chamber.03`
- `library:source.quran-tanzil-pickthall-edition` → `source.quran.tanzil-pickthall`, with reviewed seed passage `passage.quran.49.13`

An endpoint without a reviewed mapping is displayed as **UNMAPPED ENDPOINT**. This is a feature, not an error: absence of mapping prevents silent inference.

## Claim Inspection

For a mapped Knowledge Kernel record or source, the inspector can display the claims that actually reference it.

Each claim retains:

- claim ID;
- subject;
- predicate;
- literal or record object;
- claim type;
- confidence;
- status;
- provenance classes;
- method reference, when present;
- evidence rationale;
- source locator;
- limitations;
- historical-identity boundary;
- metaphysical-identity boundary;
- direct-historical-influence boundary.

A missing claim is rendered as missing. The UI does not generate a replacement interpretation.

## Source Passage Inspection

Source passages retain their content mode. The current Kernel distinguishes:

- `exact-source`
- `careful-paraphrase`
- `normalized-temple-language`
- `locator-only`

The inspector must render that mode visibly so a paraphrase cannot visually masquerade as an exact quotation.

Rights notes and limitations travel with the passage. For the reviewed Qur'an 49:13 seed, the inspector displays the short Pickthall excerpt together with the project's rights note and the limitation that the seed is not the complete verse or Arabic source text.

## Comparative Reading integration

`scripts/v5.3.0-knowledge-inspector-ui.mjs` progressively inserts a two-column **Evidence beneath the relationship** section into Comparative Reading.

It does not add a dock control and does not replace the Relationship Graph evidence cards.

The intended reading order becomes:

`Canonical Records → Knowledge Kernel Inspection → Relationship Evidence → Connectivity Path (when needed)`

On narrow screens, the two inspection columns collapse into one column.

## Privacy

The Inspector contract is `public-canonical-only`.

It reads only repository-hosted public Knowledge Kernel JSON and the explicit endpoint map. It does not read or write:

- Journey reflections or favorites;
- Library notes, bookmarks, or private correspondences;
- named-pilgrimage Reality Records;
- ritual-media state;
- localStorage;
- IndexedDB.

The inspector issues no POST, PUT, PATCH, or DELETE requests.

## Publication state

This layer is staged and not automatically loaded from the production threshold runtime. It is intentionally stacked after Comparative Reading so the full research chain can be reviewed before publication.

The next layer after this one should be a consent-aware research notebook that can reference canonical claim IDs without ever converting private reflections into public evidence.

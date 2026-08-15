# Temple of Ma'at — Relationship Resolver / Query Contract

_Last revised: 2026-08-14 · resolver foundation v5.3.0_

`scripts/v5.3.0-relationship-resolver.mjs` is the shared headless query layer over the public canonical relationship graph. Future v5.3 interfaces should consume this module rather than implementing their own edge semantics.

It does not replace `research/relationship-graph.json` and it does not create relationships. The graph remains the authority; the resolver indexes, filters, traverses, resolves, and exports what the graph already contains.

## Privacy boundary

The resolver itself does not read:

- localStorage;
- IndexedDB;
- Pilgrim Journey reflections;
- private Library notes;
- visitor favorites/bookmarks;
- device-local ritual-media state.

Its canonical relationship bundles contain graph endpoints and edges only and declare `privacy: public-canonical-only`.

A future UI may overlay private visitor state locally. That overlay is a separate consumer concern and must not be written back into `research/relationship-graph.json` or silently included in a relationship bundle.

## Endpoint syntax

All endpoints normalize to:

```text
{ namespace, recordId }
```

The convenience string form is:

```text
namespace:recordId
```

Examples:

```text
chamber:01
codex:01
dossier:01
library:source.quran-tanzil-pickthall-edition
library:study.quran-abjad-gematria
```

Unknown namespaces are rejected rather than guessed.

## Core query API

### `edges(filter)`

Returns defensive copies of canonical edges matching any supplied filters.

Supported filters include:

- relation type;
- confidence;
- status;
- claim class;
- direct-historical-influence state;
- any/all provenance layers;
- evidence basis;
- tags;
- endpoint namespace;
- edge direction;
- multi-term text query.

Filtering never changes confidence, provenance, direction, or claim boundaries.

### `neighbors(endpoint, filter)`

Returns edges touching one endpoint plus the opposite endpoint and a traversal label:

- `outgoing` — current endpoint is the `from` side of a directed edge;
- `incoming` — current endpoint is the `to` side of a directed edge;
- `peer` — undirected edge.

A caller should display this traversal state when direction matters.

### `between(left, right, filter)`

Returns canonical edges directly connecting two endpoints in either stored orientation. Edge direction remains visible in each returned edge.

### `search(query, filter)`

Searches only public edge metadata: IDs, endpoints, relation type, provenance, evidence references/notes, limitations, tags, confidence, status, and claim boundaries.

It is not a full-text search of source documents or private notes.

### `facetCounts(filter)`

Returns edge counts by:

- relation type;
- provenance layer;
- confidence;
- claim class;
- evidence basis;
- namespace appearance;
- tag.

These facets are intended for future research filters and Map legends.

### `shortestPath(start, end, options)`

Finds the shortest **connectivity path** through existing graph edges up to a bounded depth.

Important: connectivity is not causality.

The pathfinder may traverse a directed edge from either endpoint in order to answer “how are these records connected?” Every returned edge retains its original `from`, `to`, and `direction` metadata. A future UI must not display a connectivity path as a historical influence chain unless each edge independently carries an appropriate historical-influence claim.

The pathfinder never invents a bridge. Disconnected graph regions return `null`.

## Provider contract

The canonical graph stores stable endpoint IDs, not full copies of every Chamber, Codex, Dossier, or Library record. Consumers may register a provider for a namespace:

```text
provider(endpoint, context) -> record | null | Promise<record | null>
```

The provider receives:

- a defensive endpoint copy;
- the resolver API in `context.graph`;
- any explicit context supplied by the caller.

The resolver clones provider results before returning them.

If no provider exists, `resolve(endpoint)` returns:

```text
resolved: false
record: null
```

It does not guess a record and does not fetch arbitrary private state.

### Canonical provider rule

The planned browser adapter should supply providers from the existing public record systems:

- Chamber provider → canonical `chambers.json` / Temple Archive record;
- Codex provider → Living Codex record;
- Dossier provider → Shem Dossier record;
- Library provider → `library/catalog.json` and progressively loaded public indexes.

Private overlays must remain separate from these canonical providers.

## Provider lifecycle

Construction-time providers are installed only after the resolver API object exists. Late provider registration is supported through `registerProvider()` and returns the same API for fluent use.

`unregisterProvider()` removes only the resolver's provider reference. It does not mutate the underlying record store.

## Defensive-copy rule

Consumer code receives copies of edges, endpoint descriptors, namespace descriptors, provider records, and bundles. Mutating a returned object must not mutate:

- the original graph object supplied to the resolver;
- the resolver's internal indexes;
- another consumer's later query result.

This protects provenance metadata from accidental UI mutation.

## Relationship bundle export

`exportBundle()` returns:

- schema `temple-of-maat/relationship-bundle-v1`;
- source graph schema/version;
- export timestamp;
- `privacy: public-canonical-only`;
- deduplicated stable endpoints;
- selected canonical edges.

The bundle preserves:

- relation type;
- direction;
- provenance layers;
- confidence;
- evidence;
- claim boundaries;
- limitations;
- tags.

The bundle intentionally does **not** serialize resolved record bodies or private visitor overlays. A future research-export layer may add source records, quotations, or explicitly selected private notes only through a separate, consent-aware export contract.

## Consumers

The intended implementation sequence is:

1. canonical relationship graph schema/data;
2. this shared headless resolver/query core;
3. browser adapter supplying canonical endpoint providers;
4. Comparative Reading / Research Workspace;
5. unified cross-type search/export;
6. 72-node Temple Map consuming the same graph/resolver.

The Map is intentionally downstream. It should visualize already-governed relationships rather than becoming a place where relationships are invented ad hoc.

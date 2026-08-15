# Private Research Notebook

The Research Notebook is the first deliberately private layer in the v5.3 research stack.

Its purpose is to let a visitor think **with** canonical evidence without turning private interpretation into canonical evidence.

## Architecture

`Knowledge Kernel → Relationship Graph → Resolver → Browser Providers → Comparative Reading → Claim & Passage Inspection → Private Research Notebook`

Everything to the left of the Notebook is public-canonical research infrastructure. The Notebook is device-local private state.

The boundary is one-way:

> Public canonical IDs may be cited by a private note. A private note does not become a public claim, graph edge, source record, correspondence, or Knowledge Kernel object.

## Consent before persistence

Comparative Reading can prepare a draft from the current comparison. That draft may contain canonical citation IDs for the two graph endpoints plus reviewed Kernel claims, passages, and sources exposed by the Knowledge Inspector.

**Preparing a draft does not persist it.**

The user must explicitly choose **Save Entry** before the note is written to device-local storage.

This prevents a viewed comparison from silently becoming personal history.

## State contract

The public schema is:

`research/schema/research-notebook-state.v1.schema.json`

The private runtime state uses:

- schema: `temple-of-maat/research-notebook-state-v1`
- version: `1.0.0`
- privacy: `device-local-private`
- storage key: `temple_research_notebook_v1`

Each entry contains only:

- private entry ID;
- title;
- body;
- working stage;
- canonical citation references;
- creation/update timestamps.

Working stages are `note`, `question`, `hypothesis`, and `practice`. These are editorial states, not spiritual ranks or truth scores.

## Citation contract

A private entry may cite:

- a Relationship Graph endpoint, such as `chamber:01`;
- a canonical Knowledge Kernel claim ID;
- a Knowledge Kernel source-passage record ID;
- a Knowledge Kernel source ID.

Claim, passage, and source citations are validated against the public Knowledge Inspector before persistence. Graph endpoints remain endpoint references and may explicitly remain unmapped to the Knowledge Kernel.

The Notebook stores citation **IDs**, not a private rewrite of canonical source text. Current canonical metadata is resolved when the note is viewed.

## Privacy boundary

The Notebook reads/writes only its own device-local key. It does not modify:

- `research/relationship-graph.json`;
- `research/knowledge-kernel/*`;
- `library/catalog.json`;
- `chambers.json`;
- Journey reflections or favorites;
- Library bookmarks, notes, or private correspondences;
- Enoch or Pistis Sophia pilgrimage state;
- ritual-media state.

The Notebook performs no network write requests. There is no cloud synchronization in v1.

An explicit **Export Private Notebook JSON** action produces a user-controlled local JSON export. Exporting is not publishing.

## Comparative Reading integration

When explicitly installed, the Notebook adds a compact launch bar inside Comparative Reading:

- **Open Research Notebook**
- **Draft Note from Comparison**

It adds no bottom-dock control.

A comparison draft can cite the canonical IDs visible beneath that comparison, but the user remains responsible for the note's private interpretation. The Notebook never upgrades that interpretation into historical influence, metaphysical identity, or established fact.

## Release state

The Notebook is staged as a downstream layer after the Knowledge Inspector. It is not automatically loaded by the production threshold runtime.

Before publication, browser validation must demonstrate explicit-save persistence, unsaved-draft non-persistence, canonical citation validation, private-state isolation, JSON export, mobile geometry, and absence of network writes.

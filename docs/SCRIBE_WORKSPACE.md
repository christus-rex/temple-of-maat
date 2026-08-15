# Nabu–Thoth Scribe Workspace v1

The Scribe Workspace is the private research-thread layer above the Temple Research Notebook.

Its architecture is:

`Knowledge Kernel → Relationship Graph → Resolver → Comparative Reading → Claim & Passage Inspector → Research Notebook → Scribe Workspace`

The Workspace is **device-local private state**. It groups saved Research Notebook entries around a research question, carries reviewed canonical anchor IDs, and maintains an append-only Scribe ledger. Private thread content does not become Relationship Graph or Knowledge Kernel evidence.

## Comparative-archetype boundary

“Nabu–Thoth” is a modern Temple comparative archetype for the sacred scribe: receiving, measuring, recording, correcting, and transmitting knowledge. It is not a historical claim that Mesopotamian Nabu and Egyptian Djehuty/Thoth were one ancient deity.

## Scribe covenant

The v1 ledger enforces several research disciplines:

- **Observation remains distinct from inference.** They are separate ledger record types.
- **Inference requires visible reasoning.** An inference cannot be appended without a reasoning/calculation trail.
- **Uncertainty and dissent remain recordable.** They are not collapsed into a single confidence score.
- **Corrections are append-only.** A correction points to an earlier ledger event; it does not erase or rewrite the earlier record.
- **Right of reply is preserved.** A reply points to a prior ledger event and remains visible beside it in the thread history.
- **Every ledger event is dated.** Canonical source citations can be attached to consequential observations, inferences, corrections, or replies.
- **Institutional memory is preserved.** Ledger history is not silently rewritten when thread metadata changes.

This is record-keeping discipline, not an oracle and not a substitute for conscience, evidence, consent, or Ma’at.

## Private-state contract

State schema: `temple-of-maat/scribe-workspace-state-v1`

Version: `1.0.0`

Privacy: `device-local-private`

Storage key: `temple_scribe_workspace_v1`

A thread contains:

- a private title and research inquiry;
- editorial status: `open`, `paused`, or `closed`;
- references to saved private Research Notebook entry IDs;
- canonical anchor citations using the same endpoint / claim / passage / source IDs accepted by the Notebook;
- an append-only Scribe ledger;
- creation and update timestamps.

Thread status is editorial only. It is not a spiritual rank, truth score, or moral judgment.

## Ledger record types

`observation` — what was seen, read, measured, or directly recorded.

`inference` — what is reasoned from observations or sources. Visible reasoning is mandatory.

`uncertainty` — what remains unresolved or insufficiently supported.

`dissent` — a preserved disagreement or counter-reading.

`correction` — an append-only correction that must point to an earlier ledger event.

`reply` — a preserved right-of-reply record that must point to an earlier ledger event.

No ledger event is silently edited by later events. Correction is additive rather than destructive.

## Notebook relationship

The Workspace does not move private Notebook text into the public research graph. It stores Notebook **entry IDs** and canonical citation IDs. Deleting a Scribe thread does not delete the linked Notebook entries.

Attaching a cited Notebook entry can add its canonical citation IDs to the thread’s anchor set. The original Notebook entry remains the private source of the reflection.

## Consent and persistence

Creating a thread draft does not persist it.

The user must explicitly choose **Save Thread** before thread metadata is written to `temple_scribe_workspace_v1`.

Ledger history is also explicit: nothing is appended until **Add Ledger Entry** is pressed.

## Privacy and dignity

The Scribe Workspace is not a surveillance archive. Private records do not authorize monitoring another person without informed consent. Records should remain answerable to context, fair representation, humane correction, right of reply, and the right not to be reduced to a file.

The Workspace does not read or modify Journey state, Library private notes, named pilgrimage state, ritual-media state, the public Relationship Graph, or the public Knowledge Kernel.

There is no cloud sync in v1 and no network write path.

## Export

**Export Private Scribe Threads JSON** creates a user-controlled local JSON export.

Exporting is not publishing. The export remains private unless the user deliberately moves or shares it elsewhere.

## UI placement

The Scribe Workspace is available as a private research overlay from Comparative Reading and from the Research Notebook. It adds no global bottom-dock control.

On narrow screens the thread list stacks above the editor and controls remain inside the viewport.

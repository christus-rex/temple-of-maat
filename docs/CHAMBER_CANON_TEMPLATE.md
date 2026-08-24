# Chamber Canon 1.0 — Record Template

This template defines the minimum reviewable shape of a mature Temple chamber. It extends the current chamber core without rewriting the existing canonical identity fields.

## Record identity

- `number` — integer 1–72.
- `id` — zero-padded two-digit ID.
- `coreRecord` — pointer to the corresponding entry in `chambers.json`.
- `codexRecord` — pointer to the Living Codex record for the same ordinal.
- `reviewStatus` — `PENDING_REVIEW`, `REVIEWED`, or `WITHHELD`.
- `canonVersion` — first canon snapshot in which the expanded record was accepted.

## 1. Core Identity

**Authority:** existing canonical Temple data.  
**Typical provenance:** L2/L4 depending on field.

Preserve, do not silently rename:

- Angel
- Daemon / numerical twin
- Third Name
- Temple Office
- Fire
- Pillar
- Chamber Law
- Threshold Seal Name
- recurrence/tetrad flags and values where applicable

If a later review changes one of these fields, record the amendment rather than erasing the prior value.

## 2. Numerical Field

**Authority:** reproducible computation only.  
**Typical provenance:** L2.

Required properties:

- method name or canonical method ID;
- exact inputs/spelling/transliteration used;
- raw values before interpretation;
- strength/grade where the existing system defines one;
- explicit statement that equality or resonance is not proof of historical or metaphysical identity.

Unsupported number claims are not backfilled for visual symmetry.

## 3. Temple Office

**Authority:** Temple synthesis.  
**Provenance:** L4.

A one-sentence statement of the chamber's constructive function. It must describe a practice, responsibility, or ethical capacity rather than a supernatural status claim.

## 4. Chamber Law

**Authority:** Temple synthesis.  
**Provenance:** L4.

A concise directive. The law should be actionable and falsifiable enough to guide conduct. Existing chamber laws are preserved unless amended through the canon process.

## 5. Sacred Limitation

**Authority:** Temple ethics.  
**Provenance:** L4.

State what this chamber's symbolism **cannot legitimately authorize**.

Preferred form:

> This chamber does not authorize …

Examples of prohibited distortions include domination, dehumanization, coercive certainty, identity inflation, historical fabrication, or harm rationalized as sacred necessity.

## 6. Anti-Distortion Mechanism

**Authority:** Temple discernment.  
**Provenance:** L4.

Describe the corrective practice that prevents the chamber from becoming self-sealing. Good mechanisms include:

- requiring contrary evidence to remain visible;
- checking interpretation against conduct;
- separating source from synthesis;
- allowing revision when a claim fails;
- refusing to treat symbolic resonance as exclusive identity.

The mechanism must name an actual corrective behavior, not merely repeat the chamber law.

## 7. Ma'at Test

**Authority:** Temple ethics.  
**Provenance:** L4.

Use observable questions. Minimum structure:

1. Does this interpretation reduce unnecessary harm?
2. Does it increase truthfulness and accountability?
3. Does it preserve the dignity and agency of other beings?
4. Can the claim survive correction, evidence, and disagreement?
5. Does conduct become more balanced, compassionate, just, or skillful?

A chamber may add chamber-specific questions, but it may not weaken these baseline tests.

## 8. Invocation

**Authority:** original Temple composition.  
**Provenance:** L4.

Invocation text must be clearly labeled as modern/original Temple language. It must never be presented as recovered ancient scripture, historical liturgy, or a uniquely authentic traditional pronunciation unless that provenance is independently supported.

Preferred structure:

- address the chamber principle;
- state the ethical intention;
- acknowledge the limitation;
- end with a commitment to right action.

## 9. Seal Provenance

Each chamber seal receives one of these statuses:

- `SOURCE_DERIVED` — geometry or symbol can be traced to a named historical source.
- `COMPOSITE` — combines source-derived and later/Temple elements; each layer is named.
- `TEMPLE_ORIGINAL` — modern Temple artwork/synthesis.
- `UNMAPPED` — provenance has not yet been established.

A visually ancient style is not evidence of ancient provenance.

## 10. Historical Provenance

**Authority:** L1/L2 only.

Every historical note must identify the source family and, when possible, the record or bibliographic anchor. If the historical relationship is disputed, note the dispute. If no evidence is available, use:

`UNMAPPED — no reviewed historical source currently supports this relationship.`

Never infer history from shared numbers, similar names, visual resemblance, or later occult pairing alone.

## 11. Symbolic Provenance

**Authority:** L3/L4.

Name the interpretive lineage explicitly:

- comparative thematic parallel;
- later angelological/Hermetic correspondence;
- modern Temple synthesis;
- personal contemplative association;
- numerical correspondence under a stated method.

A symbolic lineage may be meaningful without being historical.

## Review block

Each mature chamber should close with:

- `reviewedBy`
- `reviewedAt`
- `sourceIds`
- `openQuestions`
- `amendments`

## Completion rule

A chamber is Canon 1.0-ready when every required family is either:

1. reviewed and populated with its provenance layer, or
2. explicitly marked `UNMAPPED`, `WITHHELD`, or `NOT_APPLICABLE` with a reason.

A blank field is not completion. A fabricated field is worse than a blank field.

# Pilgrim Journey portability and restore policy

The Pilgrim Journey is private visitor state. Its portable archive exists so a visitor can move or back up that state without publishing reflections or turning personal progress into canonical Temple data.

## Current accepted contract

The v5.2.8 importer accepts only:

- `schema`: `temple-of-maat/pilgrim-journey-v1`
- `version`: `5.2.5`

The supported restorable fields are:

- `started`
- `startedAt`
- `updatedAt`
- `current`
- `visited`
- `favorites`
- `reflections`

The existing Journey export also contains derived/reference fields such as `exportedAt`, `completion`, and `records`. Those are useful to humans but are not authoritative restore inputs. On import, the Temple rebuilds derived information from the supported state fields and the current canonical chamber records.

Chamber numbers must be integers from 1 through 72. Reflection values must be strings no longer than 12,000 characters. Unknown schema identifiers, incompatible Journey engine versions, invalid chamber values, malformed timestamps, and malformed reflection structures are rejected before any local state is changed.

## Local-only privacy boundary

Journey import uses the browser's local file picker and `File.text()`. It does not upload the selected JSON file and it does not send reflection text to a server.

The imported state is written only to the Journey's existing local-storage key on the visitor's device. A restore updates the URL with `history.replaceState()` and then reloads the page so the existing Journey engine rehydrates from the newly stored state. The manual Temple entrance remains mandatory after that reload.

## Replace strategy

**Replace** restores the supported imported state fields exactly after validation and normalization. It replaces the existing local Journey's visited chambers, favorites, current chamber, timestamps, and reflections.

Because replace is destructive, the importer shows a current/imported/result preview before the visitor can apply it. The preview states explicitly that no local change has yet been made.

## Safe merge strategy

**Merge** is intentionally non-destructive:

- visited chambers are unioned;
- favorites are unioned;
- imported reflections fill chambers that have no local reflection;
- when both sides contain different reflection text for the same chamber, the existing local reflection wins and the conflict is listed in the preview;
- if this device already has Journey state, its current chamber remains current;
- if the local Journey is empty, the imported current chamber is used;
- the earliest available `startedAt` is retained;
- `updatedAt` is refreshed to the merge time.

This merge policy is designed to avoid silently destroying private writing. Visitors who intentionally want the archive to overwrite existing reflection text should choose Replace after reviewing the preview.

## Round-trip guarantee

For the current supported schema/version, a Journey export can be restored with Replace without loss of the supported fields listed above. Extra derived export metadata does not affect the restored Journey.

Browser regression coverage exercises:

1. create Journey progress, favorites, and reflections;
2. export JSON;
3. clear local Journey state;
4. reject an incompatible archive without changing the cleared state;
5. preview the valid export;
6. replace and reload;
7. verify the supported state fields are restored;
8. verify a merge preview preserves an existing conflicting local reflection.

## Future schema and version migrations

Future Journey schema/version changes must never be silently coerced. The migration rule is:

1. Preserve the original archive unchanged.
2. Identify its exact `schema` and `version` before transformation.
3. Add an explicit, deterministic migration function from the known source version to a known target version.
4. Validate the migrated result against the target contract.
5. Show the visitor a preview of the migrated state and any dropped, renamed, or transformed fields before applying it.
6. Keep reflection text local during migration.
7. Reject unknown versions when no reviewed migration exists.

A future importer may support multiple reviewed migrations, but each path must be named and tested. A higher version number alone is never permission to guess field semantics.

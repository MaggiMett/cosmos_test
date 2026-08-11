# Theme Package import container v1

Status: narrow intake contract for locally imported, declarative full Themes.

The repository previously defined Theme Manifests and Asset Catalog records, but no canonical
file container. Import therefore uses one deliberately small ZIP contract. It is an intake
boundary, not a general packaging system.

## Transport and limits

- `POST /theme-packages/import` accepts the raw ZIP body with `Content-Type: application/zip`.
- Maximum compressed request size: 256 MiB.
- Maximum total declared uncompressed size: 256 MiB.
- Maximum entries: 256.
- Maximum descriptor or manifest size: 1 MiB each.
- Maximum individual asset size: 16 MiB, matching the Asset Catalog contract.
- Only stored and deflated ZIP entries are accepted.

## Root records

The archive contains exactly one `cosmos-theme-package.json` descriptor and exactly one
`theme-manifest.json`. Both are UTF-8 JSON objects with unique property names. The descriptor is:

```json
{
  "schemaVersion": 1,
  "packageId": "author.package.example",
  "packageVersion": "1.0.0",
  "manifest": {
    "path": "theme-manifest.json",
    "sha256": "canonical-theme-manifest-sha256"
  },
  "skinPacks": [
    {
      "path": "skin-packs/author.skin-pack.example/1.0.0/skin-pack.json",
      "sha256": "canonical-skin-pack-sha256"
    }
  ],
  "assets": [
    {
      "visualAsset": {},
      "catalogEntry": {}
    }
  ]
}
```

`skinPacks` is optional for backward-compatible token-only packages. Each entry references one
existing declarative `skin-pack.schema.json` artifact. Its digest is calculated from canonical
JSON using the same rules as the Theme Manifest. The artifact identity and version must satisfy
one of the manifest's existing `packRefs`; the container does not introduce a second pack
reference model.

`manifest.sha256` is the SHA-256 of the canonical Theme Manifest JSON representation: sorted
object keys, UTF-8, no insignificant whitespace, and no ASCII escaping. `packageVersion` must
equal the manifest version. The manifest must be a compatible `full-theme` contract. Importing
the code-native Cosmos Core Theme ID is forbidden.

Each asset declaration contains the existing Visual Asset and Asset Catalog Entry contracts.
The declared `visualAsset.path` is both its archive location and its canonical Resource path.
Only the currently supported static PNG, WebP, and safe SVG formats are accepted. Existing
Asset Catalog validation remains authoritative for MIME, signature, dimensions, size, path,
digest, SVG safety, provenance, scope, and references. Theme-scoped entries must reference the
manifest Theme ID.

No undeclared files are accepted. Preview files can be added only after a dedicated declarative
contract exists; v1 does not infer them.

SkinPack import validates the declared path, digest, schema, identity/version, manifest ownership,
and complete local asset closure before installation. Asset bindings and video fallbacks may
reference only assets declared by that SkinPack and present in the same validated package Asset
Catalog batch. SkinPacks remain declarative JSON; CSS, shaders, scripts, executable fields, and
undeclared files are rejected.

## Safety and installation

Paths must be normalized, relative POSIX paths. Absolute paths, drive paths, backslashes,
`.`/`..`, URLs, query fragments, links, special filesystem objects, encrypted entries, and
case-insensitive path collisions are rejected. Executable or active manifest content is rejected.

The raw archive is first written to a quarantine file. Validation does not mutate the Theme
Package registry, Asset Catalog, Theme Registry, or Resource storage. After all records and bytes
pass validation, new Resource bytes are staged and their Asset Catalog rows and Theme Package row
are committed as one logical transaction. A failed install removes newly finalized and staged
files and rolls back database rows. Exactly matching existing cataloged assets may be reused;
conflicting identities or bytes are rejected.

Successful import persists the package but does not activate it or mutate the live Theme Registry.
The existing startup loader registers it on the next normal application runtime startup.
Validated SkinPack artifacts are stored atomically in that same installed Package record and are
returned by the existing read endpoint; no separate SkinPack persistence authority or endpoint is
introduced.

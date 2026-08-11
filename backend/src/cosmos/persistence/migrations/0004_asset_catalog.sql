CREATE TABLE visual_assets (
    asset_id TEXT NOT NULL,
    asset_version TEXT NOT NULL,
    asset_json TEXT NOT NULL,
    resource_path TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    PRIMARY KEY (asset_id, asset_version)
);

CREATE TABLE asset_catalog_entries (
    entry_id TEXT NOT NULL,
    entry_version TEXT NOT NULL,
    visual_asset_id TEXT NOT NULL,
    visual_asset_version TEXT NOT NULL,
    entry_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (entry_id, entry_version),
    FOREIGN KEY (visual_asset_id, visual_asset_version)
        REFERENCES visual_assets(asset_id, asset_version)
);

CREATE INDEX asset_catalog_entries_visual_asset_idx
    ON asset_catalog_entries(visual_asset_id, visual_asset_version);

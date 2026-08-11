CREATE TABLE theme_packages (
    package_id TEXT NOT NULL,
    package_version TEXT NOT NULL,
    theme_id TEXT NOT NULL,
    manifest_version INTEGER NOT NULL,
    manifest_digest TEXT NOT NULL,
    record_json TEXT NOT NULL,
    installed_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (package_id, package_version)
);

CREATE INDEX theme_packages_theme_idx
    ON theme_packages(theme_id, package_version);

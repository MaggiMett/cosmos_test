CREATE TABLE objects (
    object_id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    creator TEXT NOT NULL,
    lifecycle_state TEXT NOT NULL,
    created_at TEXT NOT NULL,
    primary_project_id TEXT NULL REFERENCES objects(object_id),
    schema_version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE object_system_tags (
    object_id TEXT NOT NULL REFERENCES objects(object_id) ON DELETE CASCADE,
    system_tag TEXT NOT NULL,
    PRIMARY KEY (object_id, system_tag)
);

CREATE TABLE object_schema_versions (
    object_id TEXT NOT NULL REFERENCES objects(object_id) ON DELETE CASCADE,
    schema_id TEXT NOT NULL,
    schema_version INTEGER NOT NULL,
    PRIMARY KEY (object_id, schema_id)
);

CREATE TABLE object_properties (
    object_id TEXT NOT NULL REFERENCES objects(object_id) ON DELETE CASCADE,
    property_name TEXT NOT NULL,
    value_json TEXT NOT NULL,
    PRIMARY KEY (object_id, property_name)
);

CREATE TABLE object_user_tags (
    object_id TEXT NOT NULL REFERENCES objects(object_id) ON DELETE CASCADE,
    user_tag TEXT NOT NULL,
    PRIMARY KEY (object_id, user_tag)
);

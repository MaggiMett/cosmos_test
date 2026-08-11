CREATE TABLE prepared_structures (
    project_id TEXT NOT NULL REFERENCES objects(object_id) ON DELETE CASCADE,
    area_name TEXT NOT NULL,
    physical_path TEXT NOT NULL,
    PRIMARY KEY (project_id, area_name),
    UNIQUE (physical_path)
);

CREATE TABLE relationships (
    relationship_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES objects(object_id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL CHECK (relationship_type = 'Related'),
    endpoint_a_id TEXT NOT NULL REFERENCES objects(object_id) ON DELETE CASCADE,
    endpoint_b_id TEXT NOT NULL REFERENCES objects(object_id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    CHECK (endpoint_a_id <> endpoint_b_id)
);

CREATE INDEX relationships_project_id_idx ON relationships(project_id);
CREATE INDEX relationships_endpoint_a_idx ON relationships(endpoint_a_id);
CREATE INDEX relationships_endpoint_b_idx ON relationships(endpoint_b_id);

CREATE TABLE runtime_state (
    scope TEXT NOT NULL,
    state_key TEXT NOT NULL,
    value_json TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (scope, state_key)
);

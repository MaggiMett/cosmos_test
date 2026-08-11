CREATE TABLE knowledge_versions (
    knowledge_id TEXT NOT NULL REFERENCES objects(object_id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL CHECK (version_number > 0),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT NOT NULL,
    source_type TEXT NOT NULL,
    source_reference TEXT NOT NULL,
    author TEXT NOT NULL,
    metadata_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    PRIMARY KEY (knowledge_id, version_number)
);

CREATE INDEX knowledge_versions_created_at_idx ON knowledge_versions(created_at);

CREATE TABLE capture_drafts (
    draft_id TEXT PRIMARY KEY,
    project_id TEXT NULL REFERENCES objects(object_id) ON DELETE CASCADE,
    workspace_session_id TEXT NOT NULL,
    mode TEXT NOT NULL,
    content TEXT NOT NULL,
    attachments_json TEXT NOT NULL DEFAULT '[]',
    updated_at TEXT NOT NULL
);

CREATE INDEX capture_drafts_workspace_session_idx ON capture_drafts(workspace_session_id);

CREATE TABLE runtime_jobs (
    job_id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    priority TEXT NOT NULL,
    status TEXT NOT NULL,
    context_json TEXT NOT NULL,
    creating_service TEXT NOT NULL,
    payload_json TEXT NOT NULL DEFAULT '{}',
    result_json TEXT NULL,
    error TEXT NULL,
    progress REAL NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 1),
    resumable INTEGER NOT NULL DEFAULT 0 CHECK (resumable IN (0, 1)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX runtime_jobs_status_idx ON runtime_jobs(status, updated_at);

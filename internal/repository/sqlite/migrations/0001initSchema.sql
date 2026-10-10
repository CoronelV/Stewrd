-- 0001initSchema.sql

CREATE TABLE IF NOT EXISTS JOB_STATUS (
    statusId    INTEGER PRIMARY KEY,
    statusCode  TEXT    NOT NULL UNIQUE,
    description TEXT    NOT NULL
);

INSERT OR IGNORE INTO JOB_STATUS (statusId, statusCode, description) VALUES
    (1, 'pending',   'Waiting to be processed'),
    (2, 'running',   'Currently being processed'),
    (3, 'paused',    'Paused by the user'),
    (4, 'completed', 'Finished successfully'),
    (5, 'failed',    'Finished with errors'),
    (6, 'cancelled', 'Cancelled by the user');

CREATE TABLE IF NOT EXISTS JOB (
    jobId                TEXT PRIMARY KEY,
    name                 TEXT NOT NULL,
    description          TEXT NOT NULL DEFAULT '',
    sourceConnectionName TEXT NOT NULL,
    targetConnectionName TEXT NOT NULL,
    createdAt            TEXT NOT NULL,
    updatedAt            TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS TABLE_TASK (
    taskId           TEXT    PRIMARY KEY,
    jobId            TEXT    NOT NULL REFERENCES JOB (jobId) ON DELETE CASCADE,
    statusId         INTEGER NOT NULL DEFAULT 1 REFERENCES JOB_STATUS (statusId),
    schemaName       TEXT    NOT NULL,
    tableName        TEXT    NOT NULL,
    primaryKeyColumn TEXT    NOT NULL,
    batchSize        INTEGER NOT NULL,
    totalRows        INTEGER NOT NULL DEFAULT 0,
    processedRows    INTEGER NOT NULL DEFAULT 0,
    lastCheckpoint   TEXT,
    errorMessage     TEXT,
    startedAt        TEXT,
    finishedAt       TEXT,
    createdAt        TEXT    NOT NULL,
    updatedAt        TEXT    NOT NULL,
    UNIQUE (jobId, schemaName, tableName),
    CHECK (totalRows >= 0),
    CHECK (processedRows >= 0),
    CHECK (batchSize > 0)
);

CREATE INDEX IF NOT EXISTS idxTableTaskJobId    ON TABLE_TASK (jobId);
CREATE INDEX IF NOT EXISTS idxTableTaskStatusId ON TABLE_TASK (jobId, statusId);

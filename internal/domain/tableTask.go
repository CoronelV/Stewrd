package domain

import "time"

type TableTaskEditableFields struct {
	SchemaName       string `json:"schemaName"`
	TableName        string `json:"tableName"`
	PrimaryKeyColumn string `json:"primaryKeyColumn"`
	BatchSize        int    `json:"batchSize"`
}

type TableTask struct {
	TaskId string `json:"taskId"`
	JobId  string `json:"jobId"`
	TableTaskEditableFields
	ProgressCounters
	Status         JobStatusCode `json:"status"`
	LastCheckpoint *string       `json:"lastCheckpoint"`
	ErrorMessage   *string       `json:"errorMessage"`
	StartedAt      *time.Time    `json:"startedAt"`
	FinishedAt     *time.Time    `json:"finishedAt"`
	Timestamps
}

type TaskProgressUpdate struct {
	TaskId         string
	ProcessedRows  int64
	LastCheckpoint string
}

type TaskAggregate struct {
	TotalRows     int64
	ProcessedRows int64
	CountByStatus map[JobStatusCode]int
}

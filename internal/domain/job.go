package domain

type JobEditableFields struct {
	Name                 string `json:"name"`
	Description          string `json:"description"`
	SourceConnectionName string `json:"sourceConnectionName"`
	TargetConnectionName string `json:"targetConnectionName"`
}

type Job struct {
	JobId string `json:"jobId"`
	JobEditableFields
	Timestamps
}

type JobProgress struct {
	ProgressCounters
	Status            JobStatusCode         `json:"status"`
	TaskCountByStatus map[JobStatusCode]int `json:"taskCountByStatus"`
}

type JobDetail struct {
	Job
	Progress JobProgress `json:"progress"`
}

type ValidationStep struct {
	Key     string `json:"key"`
	Title   string `json:"title"`
	Status  string `json:"status"` // "success", "error", "warning"
	Message string `json:"message"`
	Detail  string `json:"detail,omitempty"`
}

type JobValidationResult struct {
	Valid         bool             `json:"valid"`
	SourceServer  string           `json:"sourceServer"`
	TargetServer  string           `json:"targetServer"`
	SourceVersion string           `json:"sourceVersion"`
	TargetVersion string           `json:"targetVersion"`
	Steps         []ValidationStep `json:"steps"`
}

type StartReplicationRequest struct {
	SourceTarget string `json:"sourceTarget"`
	DestTarget   string `json:"destTarget"`
	SourceSchema string `json:"sourceSchema,omitempty"`
	DestSchema   string `json:"destSchema,omitempty"`
}

const (
	SyncDirectionSourceToTarget = "source_to_target"
	SyncDirectionTargetToSource = "target_to_source"
)

// SyncRecordsRequest describes an insert-only synchronization of the records
// that exist on one side of a comparison but are missing on the other side.
type SyncRecordsRequest struct {
	SourceSchema string   `json:"sourceSchema"`
	TargetSchema string   `json:"targetSchema"`
	Table        string   `json:"table"`
	UniqueKeys   []string `json:"uniqueKeys"`
	Direction    string   `json:"direction"` // "source_to_target" | "target_to_source"
	// RowKeys optionally restricts the sync to specific rows (ComparisonRow.RowKey values).
	// When empty, every missing record is inserted.
	RowKeys []string `json:"rowKeys,omitempty"`
}

type RunningJobStats struct {
	Progress       int    `json:"progress"`
	Eta            string `json:"eta"`
	RecordsToSync  int64  `json:"recordsToSync"`
	RecordsSynced  int64  `json:"recordsSynced"`
	Throughput     int64  `json:"throughput"`
	ReplicationLag int    `json:"replicationLag"`
	Phase          string `json:"phase"`
	Errors         int    `json:"errors"`
}

type ConnectionStats struct {
	Speed   string `json:"speed"`
	Latency string `json:"latency"`
}

type RunningJobInfo struct {
	JobId            string          `json:"jobId"`
	Name             string          `json:"name"`
	Status           string          `json:"status"` // "running", "completed", "failed", "cancelled", "idle"
	JobStats         RunningJobStats `json:"jobStats"`
	SourceConnection ConnectionStats `json:"sourceConnection"`
	TargetConnection ConnectionStats `json:"targetConnection"`
	ErrorMessage     *string         `json:"errorMessage,omitempty"`
	ResultMessage    *string         `json:"resultMessage,omitempty"`
}

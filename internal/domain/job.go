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

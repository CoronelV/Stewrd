package domain

type JobStatusId int
type JobStatusCode string

const (
	StatusIdPending JobStatusId = iota + 1
	StatusIdRunning
	StatusIdPaused
	StatusIdCompleted
	StatusIdFailed
	StatusIdCancelled
)

const (
	StatusPending   JobStatusCode = "pending"
	StatusRunning   JobStatusCode = "running"
	StatusPaused    JobStatusCode = "paused"
	StatusCompleted JobStatusCode = "completed"
	StatusFailed    JobStatusCode = "failed"
	StatusCancelled JobStatusCode = "cancelled"
)

type JobStatus struct {
	StatusId    JobStatusId   `json:"statusId"`
	StatusCode  JobStatusCode `json:"statusCode"`
	Description string        `json:"description"`
}

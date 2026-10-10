package domain

import "time"

type Timestamps struct {
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type ProgressCounters struct {
	TotalRows     int64   `json:"totalRows"`
	ProcessedRows int64   `json:"processedRows"`
	Percentage    float64 `json:"percentage"`
}

package domain

import appErrors "github.com/CoronelV/Stewrd/internal/errors"

func DeriveJobStatus(countByStatus map[JobStatusCode]int) JobStatusCode {
	panic(appErrors.ErrNotImplemented)
}

func CalculatePercentage(processedRows int64, totalRows int64) float64 {
	panic(appErrors.ErrNotImplemented)
}

func BuildJobProgress(aggregate TaskAggregate) JobProgress {
	panic(appErrors.ErrNotImplemented)
}

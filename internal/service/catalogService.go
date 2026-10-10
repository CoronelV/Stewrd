package service

import (
	"context"

	"github.com/CoronelV/Stewrd/internal/domain"
	appErrors "github.com/CoronelV/Stewrd/internal/errors"
	"github.com/CoronelV/Stewrd/internal/repository"
)

type CatalogService interface {
	ListJobStatuses(ctx context.Context) ([]domain.JobStatus, error)
}

type catalogService struct {
	statuses repository.JobStatusRepository
}

var _ CatalogService = (*catalogService)(nil)

func NewCatalogService(statuses repository.JobStatusRepository) CatalogService {
	return &catalogService{statuses: statuses}
}

func (s *catalogService) ListJobStatuses(ctx context.Context) ([]domain.JobStatus, error) {
	panic(appErrors.ErrNotImplemented)
}

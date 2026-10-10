package sqlite

import (
	"context"
	"database/sql"

	"github.com/CoronelV/Stewrd/internal/domain"
	appErrors "github.com/CoronelV/Stewrd/internal/errors"
	"github.com/CoronelV/Stewrd/internal/repository"
)

type jobStatusRepository struct {
	db *sql.DB
}

var _ repository.JobStatusRepository = (*jobStatusRepository)(nil)

func NewJobStatusRepository(db *sql.DB) repository.JobStatusRepository {
	return &jobStatusRepository{db: db}
}

func (r *jobStatusRepository) List(ctx context.Context) ([]domain.JobStatus, error) {
	panic(appErrors.ErrNotImplemented)
}

func (r *jobStatusRepository) GetByCode(ctx context.Context, code domain.JobStatusCode) (*domain.JobStatus, error) {
	panic(appErrors.ErrNotImplemented)
}

func (r *jobStatusRepository) VerifyCatalog(ctx context.Context) error {
	panic(appErrors.ErrNotImplemented)
}

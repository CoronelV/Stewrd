package sqlite

import (
	"context"
	"database/sql"

	"github.com/CoronelV/Stewrd/internal/domain"
	appErrors "github.com/CoronelV/Stewrd/internal/errors"
	"github.com/CoronelV/Stewrd/internal/repository"
)

type jobRepository struct {
	db *sql.DB
}

var _ repository.JobRepository = (*jobRepository)(nil)

func NewJobRepository(db *sql.DB) repository.JobRepository {
	return &jobRepository{db: db}
}

func (r *jobRepository) Create(ctx context.Context, job *domain.Job) error {
	panic(appErrors.ErrNotImplemented)
}

func (r *jobRepository) GetById(ctx context.Context, jobId string) (*domain.Job, error) {
	panic(appErrors.ErrNotImplemented)
}

func (r *jobRepository) Update(ctx context.Context, job *domain.Job) error {
	panic(appErrors.ErrNotImplemented)
}

// Delete elimina en cascada sus TABLE_TASK (ON DELETE CASCADE).
func (r *jobRepository) Delete(ctx context.Context, jobId string) error {
	panic(appErrors.ErrNotImplemented)
}

func (r *jobRepository) List(ctx context.Context, options repository.ListOptions) ([]domain.Job, int, error) {
	panic(appErrors.ErrNotImplemented)
}

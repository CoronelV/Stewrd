package sqlite

import (
	"context"
	"database/sql"

	"github.com/CoronelV/Stewrd/internal/domain"
	appErrors "github.com/CoronelV/Stewrd/internal/errors"
	"github.com/CoronelV/Stewrd/internal/repository"
)

type tableTaskRepository struct {
	db *sql.DB
}

var _ repository.TableTaskRepository = (*tableTaskRepository)(nil)

func NewTableTaskRepository(db *sql.DB) repository.TableTaskRepository {
	return &tableTaskRepository{db: db}
}

func (r *tableTaskRepository) Create(ctx context.Context, task *domain.TableTask) error {
	panic(appErrors.ErrNotImplemented)
}

func (r *tableTaskRepository) GetById(ctx context.Context, taskId string) (*domain.TableTask, error) {
	panic(appErrors.ErrNotImplemented)
}

func (r *tableTaskRepository) Update(ctx context.Context, task *domain.TableTask) error {
	panic(appErrors.ErrNotImplemented)
}

func (r *tableTaskRepository) Delete(ctx context.Context, taskId string) error {
	panic(appErrors.ErrNotImplemented)
}

func (r *tableTaskRepository) ListByJobId(ctx context.Context, jobId string) ([]domain.TableTask, error) {
	panic(appErrors.ErrNotImplemented)
}

func (r *tableTaskRepository) ListResumableByJobId(ctx context.Context, jobId string) ([]domain.TableTask, error) {
	panic(appErrors.ErrNotImplemented)
}

func (r *tableTaskRepository) UpdateStatus(ctx context.Context, taskId string, status domain.JobStatusCode, errorMessage *string) error {
	panic(appErrors.ErrNotImplemented)
}

func (r *tableTaskRepository) UpdateTotalRows(ctx context.Context, taskId string, totalRows int64) error {
	panic(appErrors.ErrNotImplemented)
}

func (r *tableTaskRepository) SaveCheckpoints(ctx context.Context, updates []domain.TaskProgressUpdate) error {
	panic(appErrors.ErrNotImplemented)
}

// AggregateByJobId: SELECT SUM(totalRows), SUM(processedRows), statusCode, COUNT(*) ... GROUP BY statusId.
func (r *tableTaskRepository) AggregateByJobId(ctx context.Context, jobId string) (domain.TaskAggregate, error) {
	panic(appErrors.ErrNotImplemented)
}

func (r *tableTaskRepository) AggregateByJobIds(ctx context.Context, jobIds []string) (map[string]domain.TaskAggregate, error) {
	panic(appErrors.ErrNotImplemented)
}

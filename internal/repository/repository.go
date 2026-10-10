package repository

import (
	"context"

	"github.com/CoronelV/Stewrd/internal/domain"
)

type ListOptions struct {
	Limit  int
	Offset int
}

type CrudRepository[TEntity any, TId comparable] interface {
	Create(ctx context.Context, entity *TEntity) error
	GetById(ctx context.Context, id TId) (*TEntity, error)
	Update(ctx context.Context, entity *TEntity) error
	Delete(ctx context.Context, id TId) error
}

type JobRepository interface {
	CrudRepository[domain.Job, string]
	List(ctx context.Context, options ListOptions) (jobs []domain.Job, total int, err error)
}

type TableTaskRepository interface {
	CrudRepository[domain.TableTask, string]
	ListByJobId(ctx context.Context, jobId string) ([]domain.TableTask, error)
	ListResumableByJobId(ctx context.Context, jobId string) ([]domain.TableTask, error)
	UpdateStatus(ctx context.Context, taskId string, status domain.JobStatusCode, errorMessage *string) error
	UpdateTotalRows(ctx context.Context, taskId string, totalRows int64) error
	SaveCheckpoints(ctx context.Context, updates []domain.TaskProgressUpdate) error
	AggregateByJobId(ctx context.Context, jobId string) (domain.TaskAggregate, error)
	AggregateByJobIds(ctx context.Context, jobIds []string) (map[string]domain.TaskAggregate, error)
}

type JobStatusRepository interface {
	List(ctx context.Context) ([]domain.JobStatus, error)
	GetByCode(ctx context.Context, code domain.JobStatusCode) (*domain.JobStatus, error)
	VerifyCatalog(ctx context.Context) error
}

type Transactor interface {
	WithinTransaction(ctx context.Context, operation func(txCtx context.Context) error) error
}

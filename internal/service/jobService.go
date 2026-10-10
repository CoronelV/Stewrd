package service

import (
	"context"

	"github.com/CoronelV/Stewrd/internal/domain"
	appErrors "github.com/CoronelV/Stewrd/internal/errors"
	"github.com/CoronelV/Stewrd/internal/helpers"
	"github.com/CoronelV/Stewrd/internal/repository"
)

type JobService interface {
	Create(ctx context.Context, input domain.JobEditableFields) (*domain.JobDetail, error)
	GetById(ctx context.Context, jobId string) (*domain.JobDetail, error)
	List(ctx context.Context, options repository.ListOptions) (Page[domain.JobDetail], error)
	Update(ctx context.Context, jobId string, input domain.JobEditableFields) (*domain.JobDetail, error)
	Delete(ctx context.Context, jobId string) error
	Start(ctx context.Context, jobId string) error
	Cancel(ctx context.Context, jobId string) error
}

type JobServiceDependencies struct {
	Jobs        repository.JobRepository
	Tasks       repository.TableTaskRepository
	Transactor  repository.Transactor
	IdGenerator helpers.IdGenerator
	Clock       helpers.Clock
}

type jobService struct {
	deps JobServiceDependencies
}

var _ JobService = (*jobService)(nil)

func NewJobService(deps JobServiceDependencies) JobService {
	return &jobService{deps: deps}
}

func (s *jobService) Create(ctx context.Context, input domain.JobEditableFields) (*domain.JobDetail, error) {
	panic(appErrors.ErrNotImplemented)
}

func (s *jobService) GetById(ctx context.Context, jobId string) (*domain.JobDetail, error) {
	panic(appErrors.ErrNotImplemented)
}

func (s *jobService) List(ctx context.Context, options repository.ListOptions) (Page[domain.JobDetail], error) {
	panic(appErrors.ErrNotImplemented)
}

func (s *jobService) Update(ctx context.Context, jobId string, input domain.JobEditableFields) (*domain.JobDetail, error) {
	panic(appErrors.ErrNotImplemented)
}

func (s *jobService) Delete(ctx context.Context, jobId string) error {
	panic(appErrors.ErrNotImplemented)
}

func (s *jobService) Start(ctx context.Context, jobId string) error {
	panic(appErrors.ErrNotImplemented)
}

func (s *jobService) Cancel(ctx context.Context, jobId string) error {
	panic(appErrors.ErrNotImplemented)
}


package service

import (
	"context"

	"github.com/CoronelV/Stewrd/internal/domain"
	appErrors "github.com/CoronelV/Stewrd/internal/errors"
	"github.com/CoronelV/Stewrd/internal/helpers"
	"github.com/CoronelV/Stewrd/internal/repository"
)

type TaskService interface {
	Create(ctx context.Context, jobId string, input domain.TableTaskEditableFields) (*domain.TableTask, error)
	GetById(ctx context.Context, taskId string) (*domain.TableTask, error)
	ListByJobId(ctx context.Context, jobId string) ([]domain.TableTask, error)
	Update(ctx context.Context, taskId string, input domain.TableTaskEditableFields) (*domain.TableTask, error)
	Delete(ctx context.Context, taskId string) error
}

type TaskServiceDependencies struct {
	Jobs        repository.JobRepository
	Tasks       repository.TableTaskRepository
	IdGenerator helpers.IdGenerator
	Clock       helpers.Clock
}

type taskService struct {
	deps TaskServiceDependencies
}

var _ TaskService = (*taskService)(nil)

func NewTaskService(deps TaskServiceDependencies) TaskService {
	return &taskService{deps: deps}
}

func (s *taskService) Create(ctx context.Context, jobId string, input domain.TableTaskEditableFields) (*domain.TableTask, error) {
	panic(appErrors.ErrNotImplemented)
}

func (s *taskService) GetById(ctx context.Context, taskId string) (*domain.TableTask, error) {
	panic(appErrors.ErrNotImplemented)
}

func (s *taskService) ListByJobId(ctx context.Context, jobId string) ([]domain.TableTask, error) {
	panic(appErrors.ErrNotImplemented)
}

func (s *taskService) Update(ctx context.Context, taskId string, input domain.TableTaskEditableFields) (*domain.TableTask, error) {
	panic(appErrors.ErrNotImplemented)
}

func (s *taskService) Delete(ctx context.Context, taskId string) error {
	panic(appErrors.ErrNotImplemented)
}


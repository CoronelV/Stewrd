package server

import (
	"net/http"

	appErrors "github.com/CoronelV/Stewrd/internal/errors"
	"github.com/CoronelV/Stewrd/internal/logger"
	"github.com/CoronelV/Stewrd/internal/service"
)

const (
	apiPrefix       = "/api"
	pathParamJobId  = "jobId"
	pathParamTaskId = "taskId"

	routeHealth      = apiPrefix + "/health"
	routeJobStatuses = apiPrefix + "/jobStatuses"
	routeJobs        = apiPrefix + "/jobs"
	routeJobById     = routeJobs + "/{" + pathParamJobId + "}"
	routeJobStart    = routeJobById + "/start"
	routeJobCancel   = routeJobById + "/cancel"
	routeJobTasks    = routeJobById + "/tasks"
	routeTaskById    = apiPrefix + "/tasks/{" + pathParamTaskId + "}"
)

const (
	patternHealth          = http.MethodGet + " " + routeHealth      // 200
	patternListJobStatuses = http.MethodGet + " " + routeJobStatuses // 200 []JobStatus

	patternListJobs  = http.MethodGet + " " + routeJobs       // 200 Page[JobDetail]  ?limit=&offset=
	patternCreateJob = http.MethodPost + " " + routeJobs      // 201 JobDetail        body: JobEditableFields
	patternGetJob    = http.MethodGet + " " + routeJobById    // 200 JobDetail | 404
	patternUpdateJob = http.MethodPut + " " + routeJobById    // 200 JobDetail | 404 | 409
	patternDeleteJob = http.MethodDelete + " " + routeJobById // 204 | 404 | 409
	patternStartJob  = http.MethodPost + " " + routeJobStart  // 202 | 404 | 409
	patternCancelJob = http.MethodPost + " " + routeJobCancel // 202 | 404

	patternListJobTasks = http.MethodGet + " " + routeJobTasks     // 200 []TableTask
	patternCreateTask   = http.MethodPost + " " + routeJobTasks    // 201 TableTask  body: TableTaskEditableFields
	patternGetTask      = http.MethodGet + " " + routeTaskById     // 200 TableTask | 404
	patternUpdateTask   = http.MethodPut + " " + routeTaskById     // 200 TableTask | 404 | 409
	patternDeleteTask   = http.MethodDelete + " " + routeTaskById  // 204 | 404 | 409
)

type httpHandlers struct {
	jobs    service.JobService
	tasks   service.TaskService
	catalog service.CatalogService
	logger  logger.Logger
}

func newHttpHandlers(jobs service.JobService, tasks service.TaskService, catalog service.CatalogService, log logger.Logger) *httpHandlers {
	return &httpHandlers{jobs: jobs, tasks: tasks, catalog: catalog, logger: log}
}

func (h *httpHandlers) register(mux *http.ServeMux) {
	panic(appErrors.ErrNotImplemented)
}


func (h *httpHandlers) health(w http.ResponseWriter, r *http.Request) {
	panic(appErrors.ErrNotImplemented)
}

func (h *httpHandlers) listJobStatuses(w http.ResponseWriter, r *http.Request) {
	panic(appErrors.ErrNotImplemented)
}

func (h *httpHandlers) listJobs(w http.ResponseWriter, r *http.Request) {
	panic(appErrors.ErrNotImplemented)
}

func (h *httpHandlers) createJob(w http.ResponseWriter, r *http.Request) {
	panic(appErrors.ErrNotImplemented)
}

func (h *httpHandlers) getJob(w http.ResponseWriter, r *http.Request) {
	panic(appErrors.ErrNotImplemented)
}

func (h *httpHandlers) updateJob(w http.ResponseWriter, r *http.Request) {
	panic(appErrors.ErrNotImplemented)
}

func (h *httpHandlers) deleteJob(w http.ResponseWriter, r *http.Request) {
	panic(appErrors.ErrNotImplemented)
}

func (h *httpHandlers) startJob(w http.ResponseWriter, r *http.Request) {
	panic(appErrors.ErrNotImplemented)
}

func (h *httpHandlers) cancelJob(w http.ResponseWriter, r *http.Request) {
	panic(appErrors.ErrNotImplemented)
}

func (h *httpHandlers) listJobTasks(w http.ResponseWriter, r *http.Request) {
	panic(appErrors.ErrNotImplemented)
}

func (h *httpHandlers) createTask(w http.ResponseWriter, r *http.Request) {
	panic(appErrors.ErrNotImplemented)
}

func (h *httpHandlers) getTask(w http.ResponseWriter, r *http.Request) {
	panic(appErrors.ErrNotImplemented)
}

func (h *httpHandlers) updateTask(w http.ResponseWriter, r *http.Request) {
	panic(appErrors.ErrNotImplemented)
}

func (h *httpHandlers) deleteTask(w http.ResponseWriter, r *http.Request) {
	panic(appErrors.ErrNotImplemented)
}

package server

import (
	"net/http"

	"github.com/CoronelV/Stewrd/internal/domain"
	appErrors "github.com/CoronelV/Stewrd/internal/errors"
	"github.com/CoronelV/Stewrd/internal/logger"
	"github.com/CoronelV/Stewrd/internal/service"
)

const (
	apiPrefix       = "/api"
	pathParamJobId  = "jobId"
	pathParamTaskId = "taskId"

	routeHealth         = apiPrefix + "/health"
	routeJobStatuses    = apiPrefix + "/jobStatuses"
	routeJobs           = apiPrefix + "/jobs"
	routeJobById        = routeJobs + "/{" + pathParamJobId + "}"
	routeJobStart       = routeJobById + "/start"
	routeJobCancel      = routeJobById + "/cancel"
	routeJobTasks       = routeJobById + "/tasks"
	routeTaskById       = apiPrefix + "/tasks/{" + pathParamTaskId + "}"
	routeConnectionTest   = apiPrefix + "/connections/test"
	routeConnectionSave   = apiPrefix + "/connections/save"
	routeConnectionActive = apiPrefix + "/connections/active"
	routeConnectionActiveSchema = apiPrefix + "/connections/active/schema"
	routeConnectionSchemas      = apiPrefix + "/connections/schemas"
	routeConnectionTelemetry    = apiPrefix + "/connections/telemetry"
	routeConnectionSchema       = apiPrefix + "/connections/schema"

	routeJobReplicateValidate = apiPrefix + "/jobs/replicate-local/validate"
	routeJobReplicateStart    = apiPrefix + "/jobs/replicate-local/start"
	routeJobActive            = apiPrefix + "/jobs/active"
	routeJobActiveCancel      = apiPrefix + "/jobs/active/cancel"

	routeComparisonSchemas         = apiPrefix + "/comparison/schemas"
	routeComparisonValidateSchemas = apiPrefix + "/comparison/schemas/validate"
	routeComparisonTables          = apiPrefix + "/comparison/tables"
	routeComparisonData            = apiPrefix + "/comparison/data"
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

	patternTestConnection         = http.MethodPost + " " + routeConnectionTest
	patternSaveConnection         = http.MethodPost + " " + routeConnectionSave
	patternGetActiveConnection    = http.MethodGet + " " + routeConnectionActive
	patternDeleteActiveConnection = http.MethodDelete + " " + routeConnectionActive
	patternPutActiveSchema        = http.MethodPut + " " + routeConnectionActiveSchema
	patternPostActiveSchema       = http.MethodPost + " " + routeConnectionActiveSchema
	patternGetConnectionSchemas   = http.MethodGet + " " + routeConnectionSchemas
	patternGetTelemetry           = http.MethodGet + " " + routeConnectionTelemetry
	patternGetSchema              = http.MethodGet + " " + routeConnectionSchema

	patternValidateReplication = http.MethodPost + " " + routeJobReplicateValidate
	patternStartReplication    = http.MethodPost + " " + routeJobReplicateStart
	patternGetActiveJob        = http.MethodGet + " " + routeJobActive
	patternCancelActiveJob     = http.MethodPost + " " + routeJobActiveCancel

	patternGetComparisonSchemas         = http.MethodGet + " " + routeComparisonSchemas
	patternGetComparisonValidateSchemas = http.MethodGet + " " + routeComparisonValidateSchemas
	patternGetComparisonTables          = http.MethodGet + " " + routeComparisonTables
	patternPostComparisonData           = http.MethodPost + " " + routeComparisonData
)

type httpHandlers struct {
	jobs        service.JobService
	tasks       service.TaskService
	catalog     service.CatalogService
	connections service.ConnectionService
	comparison  service.ComparisonService
	logger      logger.Logger
}

func newHttpHandlers(jobs service.JobService, tasks service.TaskService, catalog service.CatalogService, connections service.ConnectionService, comparison service.ComparisonService, log logger.Logger) *httpHandlers {
	return &httpHandlers{jobs: jobs, tasks: tasks, catalog: catalog, connections: connections, comparison: comparison, logger: log}
}

// register wires only the implemented endpoints; the job/task handlers below
// are not registered until their services are implemented.
func (h *httpHandlers) register(mux *http.ServeMux) {
	mux.HandleFunc(patternHealth, h.health)
	mux.HandleFunc(patternTestConnection, h.testConnection)
	mux.HandleFunc(patternSaveConnection, h.saveConnection)
	mux.HandleFunc(patternGetActiveConnection, h.getActiveConnection)
	mux.HandleFunc(patternDeleteActiveConnection, h.removeActiveConnection)
	mux.HandleFunc(http.MethodPost+" "+apiPrefix+"/connections/remove", h.removeActiveConnection)
	mux.HandleFunc(patternPutActiveSchema, h.updatePreferredSchema)
	mux.HandleFunc(patternPostActiveSchema, h.updatePreferredSchema)
	mux.HandleFunc(patternGetConnectionSchemas, h.getConnectionSchemas)
	mux.HandleFunc(patternGetTelemetry, h.getTelemetry)
	mux.HandleFunc(patternGetSchema, h.getSchema)
	mux.HandleFunc(patternValidateReplication, h.validateReplication)
	mux.HandleFunc(patternStartReplication, h.startReplication)
	mux.HandleFunc(patternGetActiveJob, h.getActiveJob)
	mux.HandleFunc(patternCancelActiveJob, h.cancelActiveJob)
	mux.HandleFunc(patternGetComparisonSchemas, h.getComparisonSchemas)
	mux.HandleFunc(patternGetComparisonValidateSchemas, h.validateComparisonSchemas)
	mux.HandleFunc(patternGetComparisonTables, h.getComparisonTables)
	mux.HandleFunc(patternPostComparisonData, h.compareData)
}

func (h *httpHandlers) health(w http.ResponseWriter, r *http.Request) {
	writeJson(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *httpHandlers) testConnection(w http.ResponseWriter, r *http.Request) {
	input, err := decodeJson[domain.SshMysqlConnection](r)
	if err != nil {
		writeError(w, err)
		return
	}
	result, err := h.connections.TestSshMysql(r.Context(), input)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJson(w, http.StatusOK, result)
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

func (h *httpHandlers) saveConnection(w http.ResponseWriter, r *http.Request) {
	input, err := decodeJson[domain.SshMysqlConnection](r)
	if err != nil {
		writeError(w, err)
		return
	}
	target := r.URL.Query().Get("target")
	if target == "" {
		target = input.Target
	}
	if target == "" {
		target = "source"
	}
	connInfo, err := h.connections.SaveActiveSshMysql(r.Context(), target, input)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJson(w, http.StatusOK, connInfo)
}

func (h *httpHandlers) getActiveConnection(w http.ResponseWriter, r *http.Request) {
	target := r.URL.Query().Get("target")
	if target == "" {
		target = "source"
	}
	connInfo, err := h.connections.GetActiveConnection(r.Context(), target)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJson(w, http.StatusOK, connInfo)
}

func (h *httpHandlers) removeActiveConnection(w http.ResponseWriter, r *http.Request) {
	target := r.URL.Query().Get("target")
	if target == "" {
		target = "source"
	}
	if err := h.connections.RemoveConnection(r.Context(), target); err != nil {
		writeError(w, err)
		return
	}
	writeJson(w, http.StatusOK, map[string]string{"status": "removed"})
}

func (h *httpHandlers) updatePreferredSchema(w http.ResponseWriter, r *http.Request) {
	input, err := decodeJson[domain.UpdateSchemaRequest](r)
	if err != nil {
		writeError(w, err)
		return
	}
	target := r.URL.Query().Get("target")
	if target == "" {
		target = input.Target
	}
	if target == "" {
		target = "source"
	}
	connInfo, err := h.connections.UpdatePreferredSchema(r.Context(), target, input.Schema)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJson(w, http.StatusOK, connInfo)
}

func (h *httpHandlers) getConnectionSchemas(w http.ResponseWriter, r *http.Request) {
	target := r.URL.Query().Get("target")
	if target == "" {
		target = "source"
	}
	schemas, err := h.connections.GetAvailableSchemas(r.Context(), target)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJson(w, http.StatusOK, map[string][]string{"schemas": schemas})
}


func (h *httpHandlers) getTelemetry(w http.ResponseWriter, r *http.Request) {
	target := r.URL.Query().Get("target")
	if target == "" {
		target = "source"
	}
	telemetry, err := h.connections.GetTelemetry(r.Context(), target)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJson(w, http.StatusOK, telemetry)
}

func (h *httpHandlers) getSchema(w http.ResponseWriter, r *http.Request) {
	target := r.URL.Query().Get("target")
	if target == "" {
		target = "source"
	}
	requestedSchema := r.URL.Query().Get("schema")
	schema, err := h.connections.GetSchema(r.Context(), target, requestedSchema)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJson(w, http.StatusOK, schema)
}

func (h *httpHandlers) validateReplication(w http.ResponseWriter, r *http.Request) {
	input, _ := decodeJson[domain.StartReplicationRequest](r)
	result, err := h.jobs.ValidateReplication(r.Context(), input)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJson(w, http.StatusOK, result)
}

func (h *httpHandlers) startReplication(w http.ResponseWriter, r *http.Request) {
	input, _ := decodeJson[domain.StartReplicationRequest](r)
	jobInfo, err := h.jobs.StartReplication(r.Context(), input)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJson(w, http.StatusAccepted, jobInfo)
}

func (h *httpHandlers) getActiveJob(w http.ResponseWriter, r *http.Request) {
	jobInfo, err := h.jobs.GetActiveJob(r.Context())
	if err != nil {
		writeError(w, err)
		return
	}
	writeJson(w, http.StatusOK, jobInfo)
}

func (h *httpHandlers) cancelActiveJob(w http.ResponseWriter, r *http.Request) {
	if err := h.jobs.CancelActiveJob(r.Context()); err != nil {
		writeError(w, err)
		return
	}
	writeJson(w, http.StatusOK, map[string]string{"status": "cancelled"})
}

func (h *httpHandlers) getComparisonSchemas(w http.ResponseWriter, r *http.Request) {
	schemas, err := h.comparison.GetCommonSchemas(r.Context())
	if err != nil {
		writeError(w, err)
		return
	}
	writeJson(w, http.StatusOK, schemas)
}

func (h *httpHandlers) validateComparisonSchemas(w http.ResponseWriter, r *http.Request) {
	sourceSchema := r.URL.Query().Get("sourceSchema")
	targetSchema := r.URL.Query().Get("targetSchema")
	result, err := h.comparison.ValidateSchemas(r.Context(), sourceSchema, targetSchema)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJson(w, http.StatusOK, result)
}

func (h *httpHandlers) getComparisonTables(w http.ResponseWriter, r *http.Request) {
	sourceSchema := r.URL.Query().Get("sourceSchema")
	targetSchema := r.URL.Query().Get("targetSchema")
	legacySchema := r.URL.Query().Get("schema")
	if sourceSchema == "" {
		sourceSchema = legacySchema
	}
	if targetSchema == "" {
		targetSchema = legacySchema
	}
	tables, err := h.comparison.GetTablesOverview(r.Context(), sourceSchema, targetSchema)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJson(w, http.StatusOK, tables)
}

func (h *httpHandlers) compareData(w http.ResponseWriter, r *http.Request) {
	input, err := decodeJson[domain.ComparisonDataRequest](r)
	if err != nil {
		writeError(w, err)
		return
	}
	result, err := h.comparison.CompareData(r.Context(), input)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJson(w, http.StatusOK, result)
}


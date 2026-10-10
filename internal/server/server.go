// Package server exposes the embedded SPA and REST API.
package server

import (
	"context"
	"io/fs"
	"net/http"

	"github.com/CoronelV/Stewrd/internal/config"
	appErrors "github.com/CoronelV/Stewrd/internal/errors"
	"github.com/CoronelV/Stewrd/internal/logger"
	"github.com/CoronelV/Stewrd/internal/service"
)

type Dependencies struct {
	Settings       config.ServerSettings
	JobService     service.JobService
	TaskService    service.TaskService
	CatalogService service.CatalogService
	StaticFs       fs.FS // frontend.DistFs()
	Logger         logger.Logger
}

type Server struct {
	deps       Dependencies
	httpServer *http.Server
	handlers   *httpHandlers
}

func New(deps Dependencies) *Server {
	panic(appErrors.ErrNotImplemented)
}

// Start launches ListenAndServe (blocking until Shutdown).
func (s *Server) Start(ctx context.Context) error {
	panic(appErrors.ErrNotImplemented)
}

func (s *Server) Shutdown(ctx context.Context) error {
	panic(appErrors.ErrNotImplemented)
}

// routes composes a single http.ServeMux (Go 1.22+ with methods and path params):
//
//	/api/...  -> httpHandlers.register
//	/         -> newSpaHandler(StaticFs) (fallback to index.html)
func (s *Server) routes() http.Handler {
	panic(appErrors.ErrNotImplemented)
}

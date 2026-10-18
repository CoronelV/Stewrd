// Package server exposes the embedded SPA and REST API.
package server

import (
	"context"
	stdErrors "errors"
	"io/fs"
	"net"
	"net/http"
	"strconv"
	"time"

	"github.com/CoronelV/Stewrd/internal/config"
	"github.com/CoronelV/Stewrd/internal/logger"
	"github.com/CoronelV/Stewrd/internal/service"
)

type Dependencies struct {
	Settings          config.ServerSettings
	JobService        service.JobService
	TaskService       service.TaskService
	CatalogService    service.CatalogService
	ConnectionService service.ConnectionService
	ComparisonService service.ComparisonService
	StaticFs          fs.FS // frontend.DistFs(); nil disables the SPA (API only)
	Logger            logger.Logger
}

type Server struct {
	deps       Dependencies
	httpServer *http.Server
	handlers   *httpHandlers
}

func New(deps Dependencies) *Server {
	s := &Server{
		deps: deps,
		handlers: newHttpHandlers(
			deps.JobService, deps.TaskService, deps.CatalogService, deps.ConnectionService, deps.ComparisonService, deps.Logger),
	}
	s.httpServer = &http.Server{
		Addr:              net.JoinHostPort(deps.Settings.Host, strconv.Itoa(deps.Settings.Port)),
		Handler:           s.routes(),
		ReadHeaderTimeout: 10 * time.Second,
	}
	return s
}

// Start launches ListenAndServe (blocking until Shutdown).
func (s *Server) Start(ctx context.Context) error {
	s.deps.Logger.Info("http server listening", logger.Field{Key: "addr", Value: s.httpServer.Addr})
	if err := s.httpServer.ListenAndServe(); err != nil && !stdErrors.Is(err, http.ErrServerClosed) {
		return err
	}
	return nil
}

func (s *Server) Shutdown(ctx context.Context) error {
	return s.httpServer.Shutdown(ctx)
}

// routes composes a single http.ServeMux (Go 1.22+ with methods and path params):
//
//	/api/...  -> httpHandlers.register
//	/         -> newSpaHandler(StaticFs) (fallback to index.html)
func (s *Server) routes() http.Handler {
	mux := http.NewServeMux()
	s.handlers.register(mux)
	if s.deps.StaticFs != nil {
		mux.Handle("/", newSpaHandler(s.deps.StaticFs))
	}
	return mux
}

package main

import (
	"context"
	stdErrors "errors"
	"flag"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/CoronelV/Stewrd/frontend"
	"github.com/CoronelV/Stewrd/internal/config"
	"github.com/CoronelV/Stewrd/internal/logger"
	"github.com/CoronelV/Stewrd/internal/server"
	"github.com/CoronelV/Stewrd/internal/service"
)

const defaultSettingsPath = "appsettings.yaml"

func main() {
	settingsPath := flag.String("config", defaultSettingsPath, "path to the settings file")
	flag.Parse()

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	if err := run(ctx, *settingsPath); err != nil {
		fmt.Fprintln(os.Stderr, "stewrd:", err)
		os.Exit(1)
	}
}

func run(ctx context.Context, settingsPath string) error {
	settings, err := config.Load(settingsPath)
	if err != nil {
		return err
	}
	if err := settings.Validate(); err != nil {
		return err
	}
	log := logger.New(settings.Logger)

	staticFs, err := frontend.DistFs()
	if err != nil {
		log.Warn("embedded frontend unavailable, serving API only", logger.Field{Key: "error", Value: err.Error()})
		staticFs = nil
	}

	connService := service.NewConnectionService(log)
	jobService := service.NewJobService(service.JobServiceDependencies{
		ConnectionService: connService,
		Logger:            log,
	})

	srv := server.New(server.Dependencies{
		Settings:          settings.Server,
		ConnectionService: connService,
		JobService:        jobService,
		StaticFs:          staticFs,
		Logger:            log,
	})

	serverErrors := make(chan error, 1)
	go func() { serverErrors <- srv.Start(ctx) }()

	select {
	case err := <-serverErrors:
		return err
	case <-ctx.Done():
	}

	log.Info("shutting down")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), settings.Server.ShutdownTimeout)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil && !stdErrors.Is(err, context.Canceled) {
		return err
	}
	return nil
}

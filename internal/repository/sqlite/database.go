// Package sqlite implementa los contratos de internal/repository sobre SQLite embebido.
package sqlite

import (
	"context"
	"database/sql"
	"embed"

	"github.com/CoronelV/Stewrd/internal/config"
	appErrors "github.com/CoronelV/Stewrd/internal/errors"

	_ "modernc.org/sqlite" // Registra el driver "sqlite" (Go puro).
)

const driverName = "sqlite"

// Las migraciones viajan dentro del binario (mismo principio que el frontend).
//
//go:embed migrations/*.sql
var migrationsFs embed.FS

// Open abre la BD aplicando PRAGMAs: journal_mode=WAL, foreign_keys=ON, busy_timeout.
// SetMaxOpenConns(1) para escrituras serializadas y evitar SQLITE_BUSY.
func Open(ctx context.Context, settings config.DatabaseSettings) (*sql.DB, error) {
	panic(appErrors.ErrNotImplemented)
}

// Migrate aplica en orden los archivos de migrationsFs no registrados en la tabla schemaMigrations.
func Migrate(ctx context.Context, db *sql.DB) error {
	panic(appErrors.ErrNotImplemented)
}

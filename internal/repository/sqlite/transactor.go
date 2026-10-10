package sqlite

import (
	"context"
	"database/sql"

	appErrors "github.com/CoronelV/Stewrd/internal/errors"
	"github.com/CoronelV/Stewrd/internal/repository"
)

type dbExecutor interface {
	ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error)
	QueryContext(ctx context.Context, query string, args ...any) (*sql.Rows, error)
	QueryRowContext(ctx context.Context, query string, args ...any) *sql.Row
}

type transactionContextKey struct{}

type transactor struct {
	db *sql.DB
}

var _ repository.Transactor = (*transactor)(nil)

func NewTransactor(db *sql.DB) repository.Transactor {
	return &transactor{db: db}
}

func (t *transactor) WithinTransaction(ctx context.Context, operation func(txCtx context.Context) error) error {
	panic(appErrors.ErrNotImplemented)
}

func executorFromContext(ctx context.Context, db *sql.DB) dbExecutor {
	panic(appErrors.ErrNotImplemented)
}

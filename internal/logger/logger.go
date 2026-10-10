package logger

import (
	"github.com/CoronelV/Stewrd/internal/config"
	appErrors "github.com/CoronelV/Stewrd/internal/errors"
)

type Field struct {
	Key   string
	Value any
}

type Logger interface {
	Debug(message string, fields ...Field)
	Info(message string, fields ...Field)
	Warn(message string, fields ...Field)
	Error(message string, err error, fields ...Field)
	With(fields ...Field) Logger
}

func New(settings config.LoggerSettings) Logger {
	panic(appErrors.ErrNotImplemented)
}

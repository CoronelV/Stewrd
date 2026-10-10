package logger

import (
	"log/slog"
	"os"
	"strings"

	"github.com/CoronelV/Stewrd/internal/config"
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

type slogLogger struct {
	inner *slog.Logger
}

func New(settings config.LoggerSettings) Logger {
	var level slog.Level
	if err := level.UnmarshalText([]byte(settings.Level)); err != nil {
		level = slog.LevelInfo
	}
	options := &slog.HandlerOptions{Level: level}

	var handler slog.Handler
	if strings.EqualFold(settings.Format, "json") {
		handler = slog.NewJSONHandler(os.Stderr, options)
	} else {
		handler = slog.NewTextHandler(os.Stderr, options)
	}
	return &slogLogger{inner: slog.New(handler)}
}

func (l *slogLogger) Debug(message string, fields ...Field) {
	l.inner.Debug(message, toAttrs(fields)...)
}

func (l *slogLogger) Info(message string, fields ...Field) {
	l.inner.Info(message, toAttrs(fields)...)
}

func (l *slogLogger) Warn(message string, fields ...Field) {
	l.inner.Warn(message, toAttrs(fields)...)
}

func (l *slogLogger) Error(message string, err error, fields ...Field) {
	attrs := toAttrs(fields)
	if err != nil {
		attrs = append(attrs, slog.Any("error", err))
	}
	l.inner.Error(message, attrs...)
}

func (l *slogLogger) With(fields ...Field) Logger {
	return &slogLogger{inner: l.inner.With(toAttrs(fields)...)}
}

func toAttrs(fields []Field) []any {
	attrs := make([]any, 0, len(fields))
	for _, field := range fields {
		attrs = append(attrs, slog.Any(field.Key, field.Value))
	}
	return attrs
}

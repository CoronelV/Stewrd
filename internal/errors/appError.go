package errors

import stdErrors "errors"

type ErrorCode string

const (
	CodeNotFound       ErrorCode = "notFound"
	CodeValidation     ErrorCode = "validation"
	CodeConflict       ErrorCode = "conflict"
	CodeConnection     ErrorCode = "connection"
	CodeInternal       ErrorCode = "internal"
	CodeNotImplemented ErrorCode = "notImplemented"
)

var ErrNotImplemented = stdErrors.New(string(CodeNotImplemented))

type AppError struct {
	Code    ErrorCode
	Message string
	Cause   error
}

func New(code ErrorCode, message string, cause error) *AppError {
	panic(ErrNotImplemented)
}

func (e *AppError) Error() string {
	panic(ErrNotImplemented)
}

func (e *AppError) Unwrap() error {
	panic(ErrNotImplemented)
}

func CodeOf(err error) ErrorCode {
	panic(ErrNotImplemented)
}

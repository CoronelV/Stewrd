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
	return &AppError{Code: code, Message: message, Cause: cause}
}

func (e *AppError) Error() string {
	if e.Cause == nil {
		return e.Message
	}
	return e.Message + ": " + e.Cause.Error()
}

func (e *AppError) Unwrap() error {
	return e.Cause
}

// CodeOf returns the ErrorCode of the first AppError in the chain,
// CodeNotImplemented for ErrNotImplemented, or CodeInternal otherwise.
func CodeOf(err error) ErrorCode {
	var appErr *AppError
	if stdErrors.As(err, &appErr) {
		return appErr.Code
	}
	if stdErrors.Is(err, ErrNotImplemented) {
		return CodeNotImplemented
	}
	return CodeInternal
}

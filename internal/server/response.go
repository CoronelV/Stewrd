package server

import (
	"net/http"

	appErrors "github.com/CoronelV/Stewrd/internal/errors"
)

type ApiError struct {
	Summary  string `json:"summary"`
	Detailed string `json:"detailed"`
}

type ApiResponse struct {
	Status bool      `json:"status"`
	Code   int       `json:"code"`
	Data   any       `json:"data"`
	Error  *ApiError `json:"error"`
}

func writeJson(w http.ResponseWriter, status int, data any) {
	panic(appErrors.ErrNotImplemented)
}

func writeError(w http.ResponseWriter, err error) {
	panic(appErrors.ErrNotImplemented)
}

func decodeJson[TBody any](r *http.Request) (TBody, error) {
	panic(appErrors.ErrNotImplemented)
}

func httpStatusFromError(err error) int {
	panic(appErrors.ErrNotImplemented)
}

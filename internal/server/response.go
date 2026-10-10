package server

import (
	"encoding/json"
	stdErrors "errors"
	"io"
	"net/http"

	appErrors "github.com/CoronelV/Stewrd/internal/errors"
)

const maxRequestBodyBytes = 1 << 20

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
	writeEnvelope(w, status, ApiResponse{Status: status < http.StatusBadRequest, Code: status, Data: data})
}

func writeError(w http.ResponseWriter, err error) {
	status := httpStatusFromError(err)

	summary := "internal error"
	var appErr *appErrors.AppError
	if stdErrors.As(err, &appErr) {
		summary = appErr.Message
	}
	writeEnvelope(w, status, ApiResponse{
		Status: false,
		Code:   status,
		Error:  &ApiError{Summary: summary, Detailed: err.Error()},
	})
}

func writeEnvelope(w http.ResponseWriter, status int, response ApiResponse) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(response)
}

func decodeJson[TBody any](r *http.Request) (TBody, error) {
	var body TBody
	if err := json.NewDecoder(io.LimitReader(r.Body, maxRequestBodyBytes)).Decode(&body); err != nil {
		return body, appErrors.New(appErrors.CodeValidation, "invalid request body", err)
	}
	return body, nil
}

func httpStatusFromError(err error) int {
	switch appErrors.CodeOf(err) {
	case appErrors.CodeNotFound:
		return http.StatusNotFound
	case appErrors.CodeValidation:
		return http.StatusBadRequest
	case appErrors.CodeConflict:
		return http.StatusConflict
	case appErrors.CodeConnection:
		return http.StatusBadGateway
	case appErrors.CodeNotImplemented:
		return http.StatusNotImplemented
	default:
		return http.StatusInternalServerError
	}
}

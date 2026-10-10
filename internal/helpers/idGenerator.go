package helpers

import appErrors "github.com/CoronelV/Stewrd/internal/errors"

type IdGenerator interface {
	NewId() string
}

func NewUuidGenerator() IdGenerator {
	panic(appErrors.ErrNotImplemented)
}

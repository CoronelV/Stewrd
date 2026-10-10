package helpers

import (
	"time"

	appErrors "github.com/CoronelV/Stewrd/internal/errors"
)

type Clock interface {
	Now() time.Time
}

func NewSystemClock() Clock {
	panic(appErrors.ErrNotImplemented)
}

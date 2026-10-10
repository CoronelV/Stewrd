package frontend

import (
	"embed"
	"io/fs"

	appErrors "github.com/CoronelV/Stewrd/internal/errors"
)

const distDirectory = "dist"

var distFs embed.FS

func DistFs() (fs.FS, error) {
	panic(appErrors.ErrNotImplemented)
}

package frontend

import (
	"embed"
	"io/fs"
)

const distDirectory = "dist"

// Requires `npm run build` first: the build fails if frontend/dist does not exist.
//
//go:embed all:dist
var distFs embed.FS

func DistFs() (fs.FS, error) {
	return fs.Sub(distFs, distDirectory)
}

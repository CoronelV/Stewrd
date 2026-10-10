package server

import (
	"io/fs"
	"net/http"

	appErrors "github.com/CoronelV/Stewrd/internal/errors"
)

const spaIndexFile = "index.html"

// newSpaHandler serves assets from the embedded VFS; unknown routes (not /api, not /ws) fall back to index.html
// so that React Router can resolve them on the client side.
func newSpaHandler(staticFs fs.FS) http.Handler {
	panic(appErrors.ErrNotImplemented)
}

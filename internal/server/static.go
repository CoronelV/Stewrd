package server

import (
	"io/fs"
	"net/http"
	"path"
	"strings"
)

const spaIndexFile = "index.html"

// newSpaHandler serves assets from the embedded VFS; unknown routes (not /api, not /ws) fall back to index.html
// so that React Router can resolve them on the client side.
func newSpaHandler(staticFs fs.FS) http.Handler {
	fileServer := http.FileServerFS(staticFs)

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, apiPrefix+"/") || strings.HasPrefix(r.URL.Path, "/ws") {
			http.NotFound(w, r)
			return
		}

		name := strings.TrimPrefix(path.Clean(r.URL.Path), "/")
		if name != "" {
			if info, err := fs.Stat(staticFs, name); err == nil && !info.IsDir() {
				fileServer.ServeHTTP(w, r)
				return
			}
		}

		// Fallback: serve index.html directly (FileServer would redirect /index.html to /).
		index, err := fs.ReadFile(staticFs, spaIndexFile)
		if err != nil {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		_, _ = w.Write(index)
	})
}

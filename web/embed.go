package web

import (
	"embed"
	"io/fs"
	"net/http"
)

var embeddedFS embed.FS

func FS() http.FileSystem {
	sub, err := fs.Sub(embeddedFS, "frontend/dist")
	if err != nil {
		panic(err)
	}
	return http.FS(sub)
}

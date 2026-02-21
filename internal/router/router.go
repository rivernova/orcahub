package router

import (
	"github.com/gin-gonic/gin"

	containerrouter "github.com/rivernova/orcahub/internal/docker/containers/api/router"
	imagerouter "github.com/rivernova/orcahub/internal/docker/images/api/router"
	networkrouter "github.com/rivernova/orcahub/internal/docker/networks/api/router"
	volumerouter "github.com/rivernova/orcahub/internal/docker/volumes/api/router"

	containerapi "github.com/rivernova/orcahub/internal/docker/containers/api"
	imageapi "github.com/rivernova/orcahub/internal/docker/images/api"
	networkapi "github.com/rivernova/orcahub/internal/docker/networks/api"
	volumeapi "github.com/rivernova/orcahub/internal/docker/volumes/api"
)

type Handlers struct {
	//Docker
	Containers *containerapi.Handler
	Images     *imageapi.Handler
	Volumes    *volumeapi.Handler
	Networks   *networkapi.Handler

	//K8s
}

func SetupRouter(handlers *Handlers) *gin.Engine {
	r := gin.Default()

	docker := r.Group("/api/docker")
	{
		containerrouter.Register(docker, handlers.Containers)
		imagerouter.Register(docker, handlers.Images)
		volumerouter.Register(docker, handlers.Volumes)
		networkrouter.Register(docker, handlers.Networks)
	}

	// k8s := r.Group("/api/k8s")
	// {
	//     podrouter.Register(k8s, h.Pods)
	// }

	return r
}
